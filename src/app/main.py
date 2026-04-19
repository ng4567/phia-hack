import os
from pathlib import Path
from urllib.parse import urlparse

import httpx
import uvicorn
from dotenv import load_dotenv
from fastapi import FastAPI, File, Form, HTTPException, UploadFile
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
allow_origins: list[str] = []
allow_origin_regex: str | None = None

if frontend_origins_env:
    allow_origins = [
        origin.strip()
        for origin in frontend_origins_env.split(",")
        if origin.strip()
    ]
elif os.environ.get("ENV", "development").lower() == "development":
    # Dev: allow any localhost/127.0.0.1 port so Next.js port fallbacks
    # (3000 → 3001 → 3002 …) work without editing .env each time.
    allow_origin_regex = r"^http://(localhost|127\.0\.0\.1):\d+$"

if allow_origins or allow_origin_regex:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=allow_origins,
        allow_origin_regex=allow_origin_regex,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )


@app.post("/api/tryon")
async def api_tryon(
    clothes: UploadFile = File(...),
    person: UploadFile | None = File(None),
    person_url: str | None = Form(None),
):
    """Accept a garment image plus either an uploaded person image or a
    ``person_url`` to download server-side, and return FASHN try-on result URLs.
    """
    if (person is None) == (person_url is None):
        raise HTTPException(
            status_code=400,
            detail="Provide exactly one of person or person_url",
        )

    tmp_dir = Path("/tmp/style-me")
    tmp_dir.mkdir(parents=True, exist_ok=True)

    if person is not None:
        person_filename = person.filename or "person.jpg"
    else:
        parsed = urlparse(person_url or "")
        person_filename = Path(parsed.path).name or "person.jpg"

    person_path = tmp_dir / f"person_{os.getpid()}_{person_filename}"
    clothes_path = tmp_dir / f"clothes_{os.getpid()}_{clothes.filename}"
    try:
        if person is not None:
            person_path.write_bytes(await person.read())
        else:
            assert person_url is not None
            try:
                async with httpx.AsyncClient(timeout=30.0) as client:
                    resp = await client.get(
                        person_url,
                        headers={"User-Agent": "style-me-tryon/1.0"},
                        follow_redirects=True,
                    )
                    resp.raise_for_status()
                    person_bytes = resp.content
            except (httpx.HTTPError, httpx.TimeoutException) as exc:
                raise HTTPException(
                    status_code=502,
                    detail=f"Failed to download person_url: {exc}",
                )
            person_path.write_bytes(person_bytes)

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
