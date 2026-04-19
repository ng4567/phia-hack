import os
from pathlib import Path

import uvicorn
from dotenv import load_dotenv
from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

from app.utils import virtual_tryon_cached

REPO_ROOT = Path(__file__).resolve().parents[2]
load_dotenv(REPO_ROOT / ".env")

STATIC_DIR = Path(__file__).parent / "static"
DATA_DIR = Path(__file__).parent / "data"

app = FastAPI(title="Style-Me Virtual Try-On")
frontend_origins_env = os.environ.get("FRONTEND_ORIGINS")
if frontend_origins_env:
    frontend_origins = [
        origin.strip()
        for origin in frontend_origins_env.split(",")
        if origin.strip()
    ]
elif os.environ.get("ENV", "development").lower() == "development":
    frontend_origins = ["http://localhost:3000", "http://127.0.0.1:3000"]
else:
    frontend_origins = []

if frontend_origins:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=frontend_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )


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


if STATIC_DIR.is_dir():
    app.mount("/static", StaticFiles(directory=STATIC_DIR), name="static")

if DATA_DIR.is_dir():
    app.mount("/data", StaticFiles(directory=DATA_DIR), name="data")


@app.get("/")
async def index():
    index_path = STATIC_DIR / "index.html"
    if index_path.is_file():
        return FileResponse(index_path)
    return {"message": "Hello, world"}


def main():
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)


if __name__ == "__main__":
    main()
