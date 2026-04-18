import os
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

from app.utils import virtual_tryon


class _FakeResponse:
    def __init__(self, payload: dict):
        self._payload = payload

    def raise_for_status(self) -> None:
        return None

    def json(self) -> dict:
        return self._payload


class _FakeAsyncClient:
    def __init__(self, *args, **kwargs):
        self.post_calls = []
        self.get_calls = []
        self._status_index = 0

    async def __aenter__(self):
        return self

    async def __aexit__(self, exc_type, exc, tb):
        return False

    async def post(self, url: str, *, json: dict, headers: dict):
        self.post_calls.append({"url": url, "json": json, "headers": headers})
        return _FakeResponse(
            {
                "id": "123a87r9-4129-4bb3-be18-9c9fb5bd7fc1-u1",
                "error": None,
            }
        )

    async def get(self, url: str, *, headers: dict):
        self.get_calls.append({"url": url, "headers": headers})
        statuses = [
            {"id": "123a87r9-4129-4bb3-be18-9c9fb5bd7fc1-u1", "status": "processing", "error": None},
            {
                "id": "123a87r9-4129-4bb3-be18-9c9fb5bd7fc1-u1",
                "status": "completed",
                "output": ["https://cdn.fashn.ai/123a87r9-4129-4bb3-be18-9c9fb5bd7fc1-u1/output_0.png"],
                "error": None,
            },
        ]
        idx = min(self._status_index, len(statuses) - 1)
        self._status_index += 1
        return _FakeResponse(statuses[idx])


class VirtualTryOnTests(unittest.IsolatedAsyncioTestCase):
    async def test_virtual_tryon_calls_fashn_run_and_status_endpoints(self):
        with tempfile.TemporaryDirectory() as tmp:
            tmp_dir = Path(tmp)
            person = tmp_dir / "nikhil.png"
            clothes = tmp_dir / "clothes.png"
            person.write_bytes(b"fake-person-image")
            clothes.write_bytes(b"fake-clothes-image")

            fake_client = _FakeAsyncClient()

            with patch.dict(os.environ, {"FASHN-API-KEY": "test-key"}, clear=False):
                with patch("app.utils.httpx.AsyncClient", return_value=fake_client):
                    outputs = await virtual_tryon(
                        str(person),
                        str(clothes),
                        poll_interval=0,
                        timeout=5,
                    )

        self.assertEqual(
            outputs,
            ["https://cdn.fashn.ai/123a87r9-4129-4bb3-be18-9c9fb5bd7fc1-u1/output_0.png"],
        )
        self.assertEqual(len(fake_client.post_calls), 1)
        self.assertGreaterEqual(len(fake_client.get_calls), 1)

        post_call = fake_client.post_calls[0]
        self.assertEqual(post_call["url"], "https://api.fashn.ai/v1/run")
        self.assertEqual(post_call["headers"]["Authorization"], "Bearer test-key")
        self.assertEqual(post_call["json"]["model_name"], "tryon-v1.6")
        self.assertTrue(post_call["json"]["inputs"]["model_image"].startswith("data:image/png;base64,"))
        self.assertTrue(post_call["json"]["inputs"]["garment_image"].startswith("data:image/png;base64,"))

        status_call = fake_client.get_calls[-1]
        self.assertEqual(
            status_call["url"],
            "https://api.fashn.ai/v1/status/123a87r9-4129-4bb3-be18-9c9fb5bd7fc1-u1",
        )
