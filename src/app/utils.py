import asyncio
import base64
import mimetypes
import os
import uuid
from dataclasses import dataclass, field
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Optional

import httpx

FASHN_API_BASE = "https://api.fashn.ai/v1"
FASHN_MODEL = "tryon-v1.6"


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


def _file_to_data_uri(path: str) -> str:
    """Read a local image file and return a base64 data URI."""
    p = Path(path)
    if not p.is_file():
        raise FileNotFoundError(f"Image not found: {path}")
    mime, _ = mimetypes.guess_type(p.name)
    if mime is None:
        mime = "image/png"
    encoded = base64.b64encode(p.read_bytes()).decode("ascii")
    return f"data:{mime};base64,{encoded}"


async def virtual_tryon(
    person_path: str,
    clothes_path: str,
    *,
    category: str = "auto",
    mode: str = "balanced",
    poll_interval: float = 2.0,
    timeout: float = 180.0,
) -> list[str]:
    """Run a FASHN virtual try-on and return the resulting image URLs.

    Takes paths of a person's image and a clothing image, submits them to
    FASHN's `/v1/run` endpoint (tryon-v1.6 model), polls `/v1/status/{id}`
    until completion, and returns the list of output image URLs.
    """
    api_key = os.environ.get("FASHN-API-KEY") or os.environ.get("FASHN_API_KEY")
    if not api_key:
        raise RuntimeError(
            "Missing FASHN API key. Set FASHN-API-KEY (or FASHN_API_KEY) in your environment."
        )

    payload = {
        "model_name": FASHN_MODEL,
        "inputs": {
            "model_image": _file_to_data_uri(person_path),
            "garment_image": _file_to_data_uri(clothes_path),
            "category": category,
            "mode": mode,
        },
    }
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
    }

    async with httpx.AsyncClient(timeout=60.0) as client:
        run_resp = await client.post(
            f"{FASHN_API_BASE}/run", json=payload, headers=headers
        )
        run_resp.raise_for_status()
        run_data = run_resp.json()
        prediction_id = run_data.get("id")
        if not prediction_id:
            raise RuntimeError(f"FASHN run did not return an id: {run_data}")

        deadline = asyncio.get_event_loop().time() + timeout
        while True:
            status_resp = await client.get(
                f"{FASHN_API_BASE}/status/{prediction_id}", headers=headers
            )
            status_resp.raise_for_status()
            status_data = status_resp.json()
            status = status_data.get("status")

            if status == "completed":
                outputs = status_data.get("output") or []
                if not outputs:
                    raise RuntimeError("FASHN returned no output images.")
                return outputs
            if status == "failed":
                err = status_data.get("error") or "unknown error"
                raise RuntimeError(f"FASHN try-on failed: {err}")
            if asyncio.get_event_loop().time() > deadline:
                raise TimeoutError(
                    f"FASHN try-on timed out after {timeout}s (last status: {status})"
                )

            await asyncio.sleep(poll_interval)
