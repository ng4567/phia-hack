import os
import subprocess
from pathlib import Path

import uvicorn
from dotenv import load_dotenv
from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.staticfiles import StaticFiles

from app.utils import virtual_tryon_cached

REPO_ROOT = Path(__file__).resolve().parents[2]
load_dotenv(REPO_ROOT / ".env")

FRONTEND_DIR = REPO_ROOT / "src" / "frontend"
FRONTEND_DIST_DIR = FRONTEND_DIR / "out"

app = FastAPI(title="Style-Me Virtual Try-On")


@app.post("/api/tryon")
async def api_tryon(
    person: UploadFile = File(...),
    clothes: UploadFile = File(...),
):
    """Accept two uploaded images and return FASHN try-on result URLs."""
    tmp_dir = Path("/tmp/style-me")
    tmp_dir.mkdir(parents=True, exist_ok=True)
    person_path = tmp_dir / f"person_{os.getpid()}_{person.filename}"
    clothes_path = tmp_dir / f"clothes_{os.getpid()}_{clothes.filename}"
    try:
        person_path.write_bytes(await person.read())
        clothes_path.write_bytes(await clothes.read())
        try:
            outputs, cached = await virtual_tryon_cached(
                str(person_path),
                str(clothes_path),
            )
        except (RuntimeError, TimeoutError) as e:
            raise HTTPException(status_code=502, detail=str(e))
        return {"outputs": outputs, "cached": cached}
    finally:
        for p in (person_path, clothes_path):
            try:
                p.unlink(missing_ok=True)
            except OSError:
                pass


def _ensure_frontend_build() -> None:
    index_path = FRONTEND_DIST_DIR / "index.html"
    if index_path.is_file():
        return

    build_cmd = ["npm", "run", "build"]
    try:
        subprocess.run(
            build_cmd,
            cwd=FRONTEND_DIR,
            check=True,
        )
    except FileNotFoundError as exc:
        raise RuntimeError("npm is required to build the frontend") from exc
    except subprocess.CalledProcessError as exc:
        raise RuntimeError("Frontend build failed") from exc

    if not index_path.is_file():
        raise RuntimeError("Frontend build did not produce out/index.html")


app.mount(
    "/",
    StaticFiles(directory=FRONTEND_DIST_DIR, html=True, check_dir=False),
    name="frontend",
)


def main():
    _ensure_frontend_build()
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)


if __name__ == "__main__":
    main()
