import tempfile
import unittest
from pathlib import Path
from unittest.mock import AsyncMock, patch

from app.utils import virtual_tryon_cached


class TryOnChainCacheTests(unittest.IsolatedAsyncioTestCase):
    """Verify per-step caching works across a multi-step try-on chain.

    Simulates the layered chain described in
    ``docs/superpowers/specs/2026-04-18-layered-tryon-chain-design.md``:
    step 1 runs (person + garment1), step 2 runs with the *bytes* of step 1's
    output acting as the new person, and repeating step 2 hits the cache.
    """

    async def test_chain_caches_per_step(self):
        with tempfile.TemporaryDirectory() as tmp:
            tmp_path = Path(tmp)
            person = tmp_path / "phoebe.png"
            garment1 = tmp_path / "dress.jpg"
            garment2 = tmp_path / "jacket.jpg"
            # Represents the bytes we would have downloaded from step 1's
            # output URL. A different blob than the original person, so it
            # produces a different person_hash.
            step1_output_bytes = tmp_path / "step1-output.png"
            cache_db_path = tmp_path / ".cache" / "tryon-cache.sqlite3"

            person.write_bytes(b"phoebe-image")
            garment1.write_bytes(b"dress-image")
            garment2.write_bytes(b"jacket-image")
            step1_output_bytes.write_bytes(b"phoebe-wearing-dress")

            with patch.dict(
                "os.environ",
                {"TRYON_CACHE_DB_PATH": str(cache_db_path)},
                clear=False,
            ):
                with patch(
                    "app.utils.virtual_tryon",
                    new=AsyncMock(
                        side_effect=[
                            ["https://cdn.example.com/step1.png"],
                            ["https://cdn.example.com/step2.png"],
                        ]
                    ),
                ) as mock_virtual_tryon:
                    # Step 1: person + garment1 — cache miss.
                    step1_outputs, step1_cached = await virtual_tryon_cached(
                        str(person),
                        str(garment1),
                    )
                    # Step 2: step1-output bytes + garment2 — cache miss
                    # (new person_hash).
                    step2_outputs, step2_cached = await virtual_tryon_cached(
                        str(step1_output_bytes),
                        str(garment2),
                    )
                    # Step 2 repeat: same inputs — cache hit.
                    step2_repeat_outputs, step2_repeat_cached = (
                        await virtual_tryon_cached(
                            str(step1_output_bytes),
                            str(garment2),
                        )
                    )

            self.assertEqual(
                step1_outputs, ["https://cdn.example.com/step1.png"]
            )
            self.assertEqual(
                step2_outputs, ["https://cdn.example.com/step2.png"]
            )
            self.assertEqual(
                step2_repeat_outputs, ["https://cdn.example.com/step2.png"]
            )
            self.assertFalse(step1_cached)
            self.assertFalse(step2_cached)
            self.assertTrue(step2_repeat_cached)
            # Step 1 ran once, step 2 ran once, step 2 repeat hit cache.
            self.assertEqual(mock_virtual_tryon.await_count, 2)
            self.assertTrue(cache_db_path.is_file())


if __name__ == "__main__":
    unittest.main()
