import asyncio
import hashlib
import json
import os
import sqlite3
import uuid
from contextlib import closing
from dataclasses import dataclass, field
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Optional

import fal_client

FAL_TRYON_MODEL = "fal-ai/fashn/tryon/v1.6"
CACHE_DB_ENV = "TRYON_CACHE_DB_PATH"


def _cache_db_path() -> Path:
    default_path = Path(__file__).resolve().parents[2] / ".cache" / "tryon-cache.sqlite3"
    return Path(os.environ.get(CACHE_DB_ENV, str(default_path)))


def _ensure_cache_schema() -> None:
    db_path = _cache_db_path()
    db_path.parent.mkdir(parents=True, exist_ok=True)
    with closing(sqlite3.connect(db_path)) as conn:
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS tryon_cache (
                cache_key TEXT PRIMARY KEY,
                person_hash TEXT NOT NULL,
                clothes_hash TEXT NOT NULL,
                category TEXT NOT NULL,
                mode TEXT NOT NULL,
                outputs_json TEXT NOT NULL,
                created_at TEXT NOT NULL
            )
            """
        )
        conn.commit()


def _file_sha256(path: str) -> str:
    h = hashlib.sha256()
    with open(path, "rb") as f:
        for chunk in iter(lambda: f.read(1024 * 1024), b""):
            h.update(chunk)
    return h.hexdigest()


def _cache_key(
    person_hash: str,
    clothes_hash: str,
    *,
    category: str,
    mode: str,
) -> str:
    raw = f"{person_hash}:{clothes_hash}:{category}:{mode}".encode("utf-8")
    return hashlib.sha256(raw).hexdigest()


def get_cached_tryon_result(
    person_path: str,
    clothes_path: str,
    *,
    category: str = "auto",
    mode: str = "balanced",
) -> list[str] | None:
    _ensure_cache_schema()
    person_hash = _file_sha256(person_path)
    clothes_hash = _file_sha256(clothes_path)
    key = _cache_key(person_hash, clothes_hash, category=category, mode=mode)
    with closing(sqlite3.connect(_cache_db_path())) as conn:
        row = conn.execute(
            "SELECT outputs_json FROM tryon_cache WHERE cache_key = ?",
            (key,),
        ).fetchone()
    if row is None:
        return None
    outputs = json.loads(row[0])
    if not isinstance(outputs, list):
        return None
    return [str(item) for item in outputs]


def store_tryon_result(
    person_path: str,
    clothes_path: str,
    outputs: list[str],
    *,
    category: str = "auto",
    mode: str = "balanced",
) -> None:
    _ensure_cache_schema()
    person_hash = _file_sha256(person_path)
    clothes_hash = _file_sha256(clothes_path)
    key = _cache_key(person_hash, clothes_hash, category=category, mode=mode)
    with closing(sqlite3.connect(_cache_db_path())) as conn:
        conn.execute(
            """
            INSERT INTO tryon_cache (
                cache_key, person_hash, clothes_hash, category, mode, outputs_json, created_at
            )
            VALUES (?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT(cache_key) DO UPDATE SET
                outputs_json = excluded.outputs_json,
                created_at = excluded.created_at
            """,
            (
                key,
                person_hash,
                clothes_hash,
                category,
                mode,
                json.dumps(outputs),
                datetime.now(timezone.utc).isoformat(),
            ),
        )
        conn.commit()


async def virtual_tryon_cached(
    person_path: str,
    clothes_path: str,
    *,
    category: str = "auto",
    mode: str = "balanced",
    poll_interval: float = 2.0,
    timeout: float = 180.0,
) -> tuple[list[str], bool]:
    cached = get_cached_tryon_result(
        person_path,
        clothes_path,
        category=category,
        mode=mode,
    )
    if cached is not None:
        return cached, True

    outputs = await virtual_tryon(
        person_path,
        clothes_path,
        category=category,
        mode=mode,
        poll_interval=poll_interval,
        timeout=timeout,
    )
    store_tryon_result(
        person_path,
        clothes_path,
        outputs,
        category=category,
        mode=mode,
    )
    return outputs, False


# ---------------------------------------------------------------------------
# Stylist dashboard models
#
# These dataclasses back the stylist dashboard feature. A `Stylist` manages a
# portfolio of `Client`s, and each `Client` tracks the `Design`s that the
# stylist has produced for them. Stylists also carry a free-form `metadata`
# bag so downstream agents can read style preferences, brand guidelines, etc.
# when automatically generating new designs.
# ---------------------------------------------------------------------------


def _new_id() -> str:
    return uuid.uuid4().hex


@dataclass
class Design:
    """A single design produced by a stylist for a client.

    `image_urls` typically holds the outputs returned by `virtual_tryon`.
    `metadata` is a free-form bag for things like the source garment image,
    the prompt or notes used, the agent that generated it, etc.
    """

    id: str = field(default_factory=_new_id)
    image_urls: list[str] = field(default_factory=list)
    description: str = ""
    metadata: dict[str, Any] = field(default_factory=dict)
    created_at: datetime = field(default_factory=lambda: datetime.now(timezone.utc))


@dataclass
class Client:
    """A client managed by a stylist.

    Holds a back-reference to the owning stylist (by id) and the list of
    designs the stylist has created for them.
    """

    name: str
    id: str = field(default_factory=_new_id)
    stylist_id: Optional[str] = None
    photo_path: Optional[str] = None
    notes: str = ""
    metadata: dict[str, Any] = field(default_factory=dict)
    designs: list[Design] = field(default_factory=list)
    created_at: datetime = field(default_factory=lambda: datetime.now(timezone.utc))

    def add_design(self, design: Design) -> Design:
        """Attach a design to this client and return it."""
        self.designs.append(design)
        return design


@dataclass
class Stylist:
    """A stylist who manages a portfolio of clients.

    `metadata` stores information that automation agents can consume to
    produce designs on the stylist's behalf (e.g. preferred aesthetic,
    brand voice, color palette, sizing defaults).
    """

    name: str
    id: str = field(default_factory=_new_id)
    email: Optional[str] = None
    bio: str = ""
    metadata: dict[str, Any] = field(default_factory=dict)
    clients: list[Client] = field(default_factory=list)
    created_at: datetime = field(default_factory=lambda: datetime.now(timezone.utc))

    def add_client(self, client: Client) -> Client:
        """Register a client with this stylist, linking both directions."""
        client.stylist_id = self.id
        self.clients.append(client)
        return client

    def get_client(self, client_id: str) -> Optional[Client]:
        """Return the managed client with the given id, if any."""
        for client in self.clients:
            if client.id == client_id:
                return client
        return None

    def add_design_for_client(
        self, client_id: str, design: Design
    ) -> Design:
        """Record a new design under the specified client."""
        client = self.get_client(client_id)
        if client is None:
            raise KeyError(f"Unknown client id for stylist {self.id}: {client_id}")
        return client.add_design(design)


async def virtual_tryon(
    person_path: str,
    clothes_path: str,
    *,
    category: str = "auto",
    mode: str = "balanced",
    poll_interval: float = 2.0,
    timeout: float = 180.0,
) -> list[str]:
    """Run a fal.ai FASHN try-on and return output image URLs."""
    api_key = os.environ.get("FAL_KEY")
    if not api_key:
        api_key = os.environ.get("FASHN_API_KEY") or os.environ.get("FASHN-API-KEY")
        if api_key:
            # fal_client reads auth from FAL_KEY, so normalize legacy names.
            os.environ["FAL_KEY"] = api_key
    if not api_key:
        raise RuntimeError(
            "Missing FAL key. Set FAL_KEY (or FASHN_API_KEY) in your environment."
        )

    model_image_path = Path(person_path)
    garment_image_path = Path(clothes_path)
    if not model_image_path.is_file():
        raise FileNotFoundError(f"Image not found: {person_path}")
    if not garment_image_path.is_file():
        raise FileNotFoundError(f"Image not found: {clothes_path}")

    try:
        # Upload images first and pass URLs to avoid request-size limits from
        # embedding full files as base64 data URLs in the queue submission.
        model_image_url, garment_image_url = await asyncio.gather(
            fal_client.upload_file_async(str(model_image_path)),
            fal_client.upload_file_async(str(garment_image_path)),
        )
        arguments: dict[str, Any] = {
            "model_image": model_image_url,
            "garment_image": garment_image_url,
            "category": category,
            "mode": mode,
        }

        response = await fal_client.submit_async(FAL_TRYON_MODEL, arguments=arguments)
    except fal_client.FalClientHTTPError as exc:
        if exc.status_code == 413:
            raise RuntimeError(
                "fal request payload too large. Input images are too big for inline submission. "
                "Try smaller or compressed images."
            ) from exc
        raise RuntimeError(f"fal request failed ({exc.status_code}): {exc}") from exc
    except fal_client.FalClientError as exc:
        raise RuntimeError(f"fal request failed: {exc}") from exc

    loop = asyncio.get_running_loop()
    deadline = loop.time() + timeout
    logs_index = 0
    async for event in response.iter_events(with_logs=True):
        if loop.time() > deadline:
            raise TimeoutError(f"fal try-on timed out after {timeout}s")
        if isinstance(event, fal_client.Queued):
            continue
        if isinstance(event, (fal_client.InProgress, fal_client.Completed)):
            new_logs = event.logs[logs_index:]
            for log in new_logs:
                message = log.get("message", "")
                if message:
                    print(f"[fashn] {message}")
            logs_index = len(event.logs)
            if isinstance(event, fal_client.Completed):
                break
        await asyncio.sleep(poll_interval)

    result = await response.get()
    images = result.get("images") or []
    urls = [image.get("url") for image in images if image.get("url")]
    if not urls:
        raise RuntimeError(f"fal try-on returned no images: {result}")
    return urls
