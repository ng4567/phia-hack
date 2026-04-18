"""Deterministic Shopify storefront scraper used by the Product Research agent.

All POC retailers expose public ``/products.json`` and
``/collections/<handle>/products.json`` feeds. This module centralises HTTP
calls, normalisation, and a small on-disk cache so repeated queries within a
session don't hit the retailer twice.
"""

from __future__ import annotations

import hashlib
import json
import os
import sqlite3
from contextlib import closing
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Any, Optional

import httpx

from .retailers import POC_RETAILERS, Retailer
from .schemas import Product, ProductVariant

USER_AGENT = "StyleMeResearchBot/0.1 (+https://phia.example)"
DEFAULT_TIMEOUT = 15.0
CACHE_TTL = timedelta(hours=6)
CACHE_DB_ENV = "SHOPIFY_CACHE_DB_PATH"


# ---------------------------------------------------------------------------
# Cache
# ---------------------------------------------------------------------------


def _cache_db_path() -> Path:
    default = Path(__file__).resolve().parents[3] / ".cache" / "shopify-cache.sqlite3"
    return Path(os.environ.get(CACHE_DB_ENV, str(default)))


def _ensure_cache() -> None:
    path = _cache_db_path()
    path.parent.mkdir(parents=True, exist_ok=True)
    with closing(sqlite3.connect(path)) as conn:
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS shopify_cache (
                cache_key TEXT PRIMARY KEY,
                url TEXT NOT NULL,
                payload TEXT NOT NULL,
                fetched_at TEXT NOT NULL
            )
            """
        )
        conn.commit()


def _cache_get(url: str) -> Optional[Any]:
    _ensure_cache()
    key = hashlib.sha256(url.encode()).hexdigest()
    with closing(sqlite3.connect(_cache_db_path())) as conn:
        row = conn.execute(
            "SELECT payload, fetched_at FROM shopify_cache WHERE cache_key = ?",
            (key,),
        ).fetchone()
    if not row:
        return None
    fetched_at = datetime.fromisoformat(row[1])
    if datetime.now(timezone.utc) - fetched_at > CACHE_TTL:
        return None
    return json.loads(row[0])


def _cache_put(url: str, payload: Any) -> None:
    _ensure_cache()
    key = hashlib.sha256(url.encode()).hexdigest()
    with closing(sqlite3.connect(_cache_db_path())) as conn:
        conn.execute(
            """
            INSERT INTO shopify_cache (cache_key, url, payload, fetched_at)
            VALUES (?, ?, ?, ?)
            ON CONFLICT(cache_key) DO UPDATE SET
                payload = excluded.payload,
                fetched_at = excluded.fetched_at
            """,
            (key, url, json.dumps(payload), datetime.now(timezone.utc).isoformat()),
        )
        conn.commit()


# ---------------------------------------------------------------------------
# HTTP
# ---------------------------------------------------------------------------


async def _get_json(url: str, *, use_cache: bool = True) -> Any:
    if use_cache:
        cached = _cache_get(url)
        if cached is not None:
            return cached
    async with httpx.AsyncClient(
        timeout=DEFAULT_TIMEOUT,
        follow_redirects=True,
        headers={"User-Agent": USER_AGENT, "Accept": "application/json"},
    ) as client:
        resp = await client.get(url)
        resp.raise_for_status()
        data = resp.json()
    if use_cache:
        _cache_put(url, data)
    return data


# ---------------------------------------------------------------------------
# Normalisation
# ---------------------------------------------------------------------------


def _normalize_product(raw: dict[str, Any], retailer: Retailer) -> Product:
    variants_raw = raw.get("variants") or []
    variants = [
        ProductVariant(
            id=int(v["id"]),
            title=str(v.get("title") or ""),
            option1=v.get("option1"),
            option2=v.get("option2"),
            option3=v.get("option3"),
            price=str(v["price"]) if v.get("price") is not None else None,
            available=bool(v.get("available", False)),
        )
        for v in variants_raw
    ]
    available_sizes = sorted(
        {v.option1 for v in variants if v.available and v.option1}
    )
    price = variants[0].price if variants else None
    images = raw.get("images") or []
    image_url = images[0]["src"] if images and images[0].get("src") else None
    handle = str(raw["handle"])
    url = f"{retailer.base}/products/{handle}"
    tags_raw = raw.get("tags") or []
    if isinstance(tags_raw, str):
        tags = [t.strip() for t in tags_raw.split(",") if t.strip()]
    else:
        tags = [str(t) for t in tags_raw]
    return Product(
        retailer_id=retailer.id,
        retailer_name=retailer.name,
        source_id=int(raw["id"]),
        handle=handle,
        title=str(raw.get("title") or handle),
        vendor=raw.get("vendor"),
        product_type=raw.get("product_type"),
        tags=tags,
        url=url,
        image_url=image_url,
        price=price,
        available_sizes=available_sizes,
        variants=variants,
    )


# ---------------------------------------------------------------------------
# Public tools (exposed to agents)
# ---------------------------------------------------------------------------


async def list_new_arrivals(
    retailer_id: str,
    *,
    collection: Optional[str] = None,
    limit: int = 30,
) -> list[Product]:
    """Return newest-arrival products for a POC retailer.

    ``collection`` selects one of the handles in ``Retailer.collections``
    (e.g. ``"womens_new"``). If omitted the first registered collection is
    used.
    """
    retailer = POC_RETAILERS.get(retailer_id)
    if retailer is None:
        raise ValueError(
            f"Unknown retailer '{retailer_id}'. Allowed: "
            + ", ".join(POC_RETAILERS)
        )
    if not retailer.collections:
        raise ValueError(f"Retailer '{retailer_id}' has no collections configured")
    handle = (
        retailer.collections.get(collection)
        if collection
        else next(iter(retailer.collections.values()))
    )
    if handle is None:
        raise ValueError(
            f"Collection '{collection}' not configured for retailer '{retailer_id}'"
        )
    limit = max(1, min(limit, 50))
    url = f"{retailer.base}/collections/{handle}/products.json?limit={limit}"
    data = await _get_json(url)
    raw_products = data.get("products") or []
    return [_normalize_product(p, retailer) for p in raw_products]


async def get_product(retailer_id: str, handle: str) -> Product:
    """Fetch the full detail for a single product handle."""
    retailer = POC_RETAILERS.get(retailer_id)
    if retailer is None:
        raise ValueError(f"Unknown retailer '{retailer_id}'")
    url = f"{retailer.base}/products/{handle}.json"
    data = await _get_json(url)
    raw = data.get("product")
    if not raw:
        raise ValueError(f"No product at {url}")
    return _normalize_product(raw, retailer)
