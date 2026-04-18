import os
import tempfile
import unittest
from pathlib import Path
from unittest.mock import AsyncMock, patch

import fal_client

from app import utils


class _FakeHandle:
    async def iter_events(self, with_logs: bool = True):
        yield fal_client.Queued(position=0)
        yield fal_client.InProgress(logs=[{"message": "working"}])
        yield fal_client.Completed(logs=[{"message": "done"}], metrics={})

    async def get(self) -> dict:
        return {
            "images": [
                {"url": "https://cdn.fashn.ai/123a87r9-4129-4bb3-be18-9c9fb5bd7fc1-u1/output_0.png"}
            ]
        }


class VirtualTryOnTests(unittest.IsolatedAsyncioTestCase):
    async def test_virtual_tryon_uploads_files_and_submits_urls(self):
        with tempfile.TemporaryDirectory() as tmp:
            tmp_dir = Path(tmp)
            person = tmp_dir / "nikhil.png"
            clothes = tmp_dir / "clothes.png"
            person.write_bytes(b"fake-person-image")
            clothes.write_bytes(b"fake-clothes-image")

            upload_mock = AsyncMock(
                side_effect=[
                    "https://cdn.fal.ai/model.png",
                    "https://cdn.fal.ai/garment.png",
                ]
            )
            submit_mock = AsyncMock(return_value=_FakeHandle())

            with patch.dict(os.environ, {"FAL_KEY": "test-key"}, clear=False):
                with patch("app.utils.fal_client.upload_file_async", upload_mock):
                    with patch("app.utils.fal_client.submit_async", submit_mock):
                        outputs = await utils.virtual_tryon(
                            str(person),
                            str(clothes),
                            poll_interval=0,
                            timeout=5,
                        )

        self.assertEqual(
            outputs,
            ["https://cdn.fashn.ai/123a87r9-4129-4bb3-be18-9c9fb5bd7fc1-u1/output_0.png"],
        )
        self.assertEqual(upload_mock.await_count, 2)
        submit_mock.assert_awaited_once()

        self.assertEqual(submit_mock.await_args.args[0], utils.FAL_TRYON_MODEL)
        submitted_args = submit_mock.await_args.kwargs["arguments"]
        self.assertEqual(submitted_args["model_image"], "https://cdn.fal.ai/model.png")
        self.assertEqual(submitted_args["garment_image"], "https://cdn.fal.ai/garment.png")
        self.assertEqual(submitted_args["category"], "auto")
        self.assertEqual(submitted_args["mode"], "balanced")

    async def test_virtual_tryon_cached_reuses_previous_outputs(self):
        with tempfile.TemporaryDirectory() as tmp:
            tmp_dir = Path(tmp)
            cache_db = tmp_dir / "tryon-cache.sqlite3"
            person = tmp_dir / "nikhil.png"
            clothes = tmp_dir / "clothes.png"
            person.write_bytes(b"same-person-image")
            clothes.write_bytes(b"same-clothes-image")

            run_mock = AsyncMock(return_value=["https://cdn.fashn.ai/cached/output_0.png"])

            with patch.dict(
                os.environ,
                {"FAL_KEY": "test-key", "TRYON_CACHE_DB_PATH": str(cache_db)},
                clear=False,
            ):
                with patch("app.utils.virtual_tryon", run_mock):
                    first_outputs, first_cached = await utils.virtual_tryon_cached(
                        str(person),
                        str(clothes),
                    )
                    second_outputs, second_cached = await utils.virtual_tryon_cached(
                        str(person),
                        str(clothes),
                    )

        self.assertEqual(first_outputs, ["https://cdn.fashn.ai/cached/output_0.png"])
        self.assertFalse(first_cached)
        self.assertEqual(second_outputs, ["https://cdn.fashn.ai/cached/output_0.png"])
        self.assertTrue(second_cached)
        run_mock.assert_awaited_once()
