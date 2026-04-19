import unittest
from unittest.mock import AsyncMock, patch

from fastapi.testclient import TestClient

from app.main import app


class AgentMessageApiTests(unittest.TestCase):
    def setUp(self) -> None:
        self.client = TestClient(app)

    def test_dress_upcoming_events_runs_full_flow(self):
        with patch(
            "app.main.generate_styling_reply",
            new=AsyncMock(return_value="Mock GPT styling response"),
        ) as mock_reply:
            response = self.client.post(
                "/api/agent/message",
                json={
                    "message": "Dress me for my upcoming events",
                    "source": "google_calendar",
                    "person_image_uri": "https://example.com/me.png",
                },
            )
        self.assertEqual(response.status_code, 200)

        payload = response.json()
        self.assertTrue(payload["intent_recognized"])
        self.assertTrue(payload["llm_used"])
        self.assertEqual(payload["reply"], "Mock GPT styling response")
        self.assertGreater(len(payload["events"]), 0)
        self.assertEqual(len(payload["products_by_event"]), len(payload["events"]))
        self.assertEqual(len(payload["localized_outfits"]), len(payload["events"]))
        self.assertGreater(len(payload["all_products"]), 0)
        mock_reply.assert_awaited_once()

        first_outfit = payload["localized_outfits"][0]
        self.assertIn("event_id", first_outfit)
        self.assertIn("description", first_outfit)

    def test_non_dress_message_returns_guidance(self):
        response = self.client.post(
            "/api/agent/message",
            json={"message": "hello"},
        )
        self.assertEqual(response.status_code, 200)
        payload = response.json()
        self.assertFalse(payload["intent_recognized"])
        self.assertIn("upcoming events", payload["reply"].lower())

    def test_invalid_source_returns_400(self):
        response = self.client.post(
            "/api/agent/message",
            json={
                "message": "dress me for upcoming events",
                "source": "not_a_calendar",
            },
        )
        self.assertEqual(response.status_code, 400)
        payload = response.json()
        self.assertIn("Unsupported source", payload["detail"])

    def test_gpt_failure_surfaces_503(self):
        with patch(
            "app.main.generate_styling_reply",
            new=AsyncMock(side_effect=RuntimeError("Missing Foundry configuration")),
        ):
            response = self.client.post(
                "/api/agent/message",
                json={
                    "message": "dress me for upcoming events",
                    "source": "google_calendar",
                },
            )

        self.assertEqual(response.status_code, 503)
        payload = response.json()
        self.assertIn("Missing Foundry configuration", payload["detail"])


if __name__ == "__main__":
    unittest.main()
