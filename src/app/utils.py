import asyncio
import os
import uuid
from dataclasses import dataclass, field
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Optional

import fal_client

FAL_TRYON_MODEL = "fal-ai/fashn/tryon/v1.6"


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
        raise RuntimeError(
            "Missing FAL key. Set FAL_KEY in your environment."
        )

    model_image_path = Path(person_path)
    garment_image_path = Path(clothes_path)
    if not model_image_path.is_file():
        raise FileNotFoundError(f"Image not found: {person_path}")
    if not garment_image_path.is_file():
        raise FileNotFoundError(f"Image not found: {clothes_path}")

    arguments: dict[str, Any] = {
        "model_image": fal_client.encode_file(str(model_image_path)),
        "garment_image": fal_client.encode_file(str(garment_image_path)),
        "category": category,
        "mode": mode,
    }

    response = await fal_client.submit_async(FAL_TRYON_MODEL, arguments=arguments)

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
