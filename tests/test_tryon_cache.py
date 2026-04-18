import tempfile
import unittest
from pathlib import Path
from unittest.mock import AsyncMock, patch

from app.utils import virtual_tryon_cached


class TryOnCacheTests(unittest.IsolatedAsyncioTestCase):
    async def test_virtual_tryon_cached_uses_sqlite_cache(self):
        with tempfile.TemporaryDirectory() as tmp:
            tmp_path = Path(tmp)
            person = tmp_path / "phoebe.png"
            clothes = tmp_path / "dress.jpg"
            cache_db_path = tmp_path / ".cache" / "tryon-cache.sqlite3"
            person.write_bytes(b"phoebe-image")
            clothes.write_bytes(b"dress-image")

            with patch.dict(
                "os.environ",
                {"TRYON_CACHE_DB_PATH": str(cache_db_path)},
                clear=False,
            ):
                with patch(
                    "app.utils.virtual_tryon",
                    new=AsyncMock(return_value=["https://cdn.example.com/cached.png"]),
                ) as mock_virtual_tryon:
                    first_outputs, first_cached = await virtual_tryon_cached(
                        str(person),
                        str(clothes),
                    )
                    second_outputs, second_cached = await virtual_tryon_cached(
                        str(person),
                        str(clothes),
                    )

            self.assertEqual(first_outputs, ["https://cdn.example.com/cached.png"])
            self.assertEqual(second_outputs, ["https://cdn.example.com/cached.png"])
            self.assertFalse(first_cached)
            self.assertTrue(second_cached)
            self.assertEqual(mock_virtual_tryon.await_count, 1)
            self.assertTrue(cache_db_path.is_file())
