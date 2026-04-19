import unittest
from unittest.mock import AsyncMock, patch

from fastapi.testclient import TestClient

from app.main import app


class ApiTryOnTests(unittest.TestCase):
    @patch("app.main.virtual_tryon_cached", new_callable=AsyncMock)
    def test_api_tryon_returns_backend_payload(self, mock_virtual_tryon_cached: AsyncMock):
        mock_virtual_tryon_cached.return_value = (
            ["https://cdn.example.com/generated.png"],
            True,
        )
        client = TestClient(app)

        response = client.post(
            "/api/tryon",
            files={
                "person": ("phoebe.png", b"person-image", "image/png"),
                "clothes": ("dress.jpg", b"dress-image", "image/jpeg"),
            },
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            response.json(),
            {"outputs": ["https://cdn.example.com/generated.png"], "cached": True},
        )
        mock_virtual_tryon_cached.assert_awaited_once()

    @patch("app.main.virtual_tryon_cached", new_callable=AsyncMock)
    def test_api_tryon_maps_tryon_errors_to_502(self, mock_virtual_tryon_cached: AsyncMock):
        mock_virtual_tryon_cached.side_effect = RuntimeError("missing key")
        client = TestClient(app)

        response = client.post(
            "/api/tryon",
            files={
                "person": ("phoebe.png", b"person-image", "image/png"),
                "clothes": ("dress.jpg", b"dress-image", "image/jpeg"),
            },
        )

        self.assertEqual(response.status_code, 502)
        self.assertEqual(response.json(), {"detail": "missing key"})

