import asyncio
import base64
import mimetypes
import os
from dataclasses import dataclass, field
from pathlib import Path
from typing import Optional

import httpx

FASHN_API_BASE = "https://api.fashn.ai/v1"
FASHN_MODEL = "tryon-v1.6"


@dataclass
class Design:
    """A design created by a stylist for a client.

    Attributes:
        name: Short descriptive name for this design.
        clothes_image_path: Local path to the garment image used in the try-on.
        result_image_urls: URLs of the virtual try-on output images returned by FASHN.
        description: Optional longer description or notes about the design.
    """

    name: str
    clothes_image_path: str
    result_image_urls: list[str] = field(default_factory=list)
    description: Optional[str] = None


@dataclass
class Client:
    """A client in a stylist's portfolio.

    Attributes:
        name: The client's full name.
        photo_paths: Paths to images of the client used for virtual try-on.
        designs: Designs the stylist has created for this client.
    """

    name: str
    photo_paths: list[str] = field(default_factory=list)
    designs: list[Design] = field(default_factory=list)

    def add_design(self, design: Design) -> None:
        """Append a new design to this client's history."""
        self.designs.append(design)


@dataclass
class Stylist:
    """A stylist who manages a portfolio of clients.

    Attributes:
        name: The stylist's full name.
        clients: The list of clients in this stylist's portfolio.
    """

    name: str
    clients: list[Client] = field(default_factory=list)

    def add_client(self, client: Client) -> None:
        """Add a client to the portfolio.

        Raises:
            ValueError: If a client with the same name already exists.
        """
        if self.get_client(client.name) is not None:
            raise ValueError(f"A client named '{client.name}' is already in the portfolio.")
        self.clients.append(client)

    def get_client(self, name: str) -> Optional[Client]:
        """Return the first client whose name matches (case-insensitive), or None if not found."""
        name_lower = name.lower()
        for client in self.clients:
            if client.name.lower() == name_lower:
                return client
        return None


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
