import os
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

from app.utils import Client, Design, Stylist, virtual_tryon


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


class PortfolioModelTests(unittest.TestCase):
    """Tests for the Design, Client, and Stylist dataclasses."""

    def test_design_defaults(self):
        design = Design(name="Summer Look", clothes_image_path="shirt.png")
        self.assertEqual(design.name, "Summer Look")
        self.assertEqual(design.clothes_image_path, "shirt.png")
        self.assertEqual(design.result_image_urls, [])
        self.assertIsNone(design.description)

    def test_design_with_results(self):
        design = Design(
            name="Evening Outfit",
            clothes_image_path="dress.png",
            result_image_urls=["https://cdn.example.com/result.png"],
            description="Formal evening look",
        )
        self.assertEqual(len(design.result_image_urls), 1)
        self.assertEqual(design.description, "Formal evening look")

    def test_client_defaults(self):
        client = Client(name="Alice")
        self.assertEqual(client.name, "Alice")
        self.assertEqual(client.photo_paths, [])
        self.assertEqual(client.designs, [])

    def test_client_add_design(self):
        client = Client(name="Bob", photo_paths=["bob.png"])
        design = Design(name="Casual", clothes_image_path="jeans.png")
        client.add_design(design)
        self.assertEqual(len(client.designs), 1)
        self.assertIs(client.designs[0], design)

    def test_stylist_add_and_get_client(self):
        stylist = Stylist(name="Maria")
        alice = Client(name="Alice")
        bob = Client(name="Bob")
        stylist.add_client(alice)
        stylist.add_client(bob)
        self.assertEqual(len(stylist.clients), 2)
        self.assertIs(stylist.get_client("Alice"), alice)
        self.assertIs(stylist.get_client("Bob"), bob)

    def test_stylist_get_client_case_insensitive(self):
        stylist = Stylist(name="Maria")
        alice = Client(name="Alice")
        stylist.add_client(alice)
        self.assertIs(stylist.get_client("alice"), alice)
        self.assertIs(stylist.get_client("ALICE"), alice)

    def test_stylist_get_client_not_found(self):
        stylist = Stylist(name="Maria")
        self.assertIsNone(stylist.get_client("Nobody"))

    def test_stylist_add_duplicate_client_raises(self):
        stylist = Stylist(name="Maria")
        stylist.add_client(Client(name="Alice"))
        with self.assertRaises(ValueError):
            stylist.add_client(Client(name="Alice"))

    def test_stylist_portfolio_end_to_end(self):
        stylist = Stylist(name="Sophia")
        client = Client(name="Carlos", photo_paths=["carlos.png"])
        design = Design(
            name="Beach Day",
            clothes_image_path="swimwear.png",
            result_image_urls=["https://cdn.example.com/beach.png"],
        )
        client.add_design(design)
        stylist.add_client(client)

        retrieved = stylist.get_client("Carlos")
        self.assertIsNotNone(retrieved)
        self.assertEqual(len(retrieved.designs), 1)
        self.assertEqual(retrieved.designs[0].result_image_urls, ["https://cdn.example.com/beach.png"])

