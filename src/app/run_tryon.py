"""Run a one-off virtual try-on against local images in src/app/data/."""
import asyncio
from pathlib import Path

from app.main import virtual_tryon

DATA_DIR = Path(__file__).parent / "data"


async def _main():
    person = DATA_DIR / "nikhil.png"
    clothes = DATA_DIR / "clothes.png"
    outputs = await virtual_tryon(str(person), str(clothes))
    print("Try-on outputs:")
    for url in outputs:
        print(" -", url)


if __name__ == "__main__":
    asyncio.run(_main())
