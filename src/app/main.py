import os
import sys
import importlib.util
from pathlib import Path
from typing import Any
from urllib.parse import urlparse

import httpx
import uvicorn
from dotenv import load_dotenv
from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field

from app.utils import virtual_tryon_cached

REPO_ROOT = Path(__file__).resolve().parents[2]
load_dotenv(REPO_ROOT / ".env")

try:
    from agent.agent import (
        Image,
        generate_styling_reply,
        get_user_events,
        localize,
        make_design,
        search_products,
    )
except ModuleNotFoundError:
    agent_module_path = REPO_ROOT / "agent" / "agent.py"
    spec = importlib.util.spec_from_file_location("phia_agent_runtime", agent_module_path)
    if spec is None or spec.loader is None:
        raise ModuleNotFoundError(f"Unable to load agent module from {agent_module_path}")
    agent_module = importlib.util.module_from_spec(spec)
    sys.modules[spec.name] = agent_module
    spec.loader.exec_module(agent_module)
    Image = agent_module.Image
    generate_styling_reply = agent_module.generate_styling_reply
    get_user_events = agent_module.get_user_events
    localize = agent_module.localize
    make_design = agent_module.make_design
    search_products = agent_module.search_products

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


class AgentMessageRequest(BaseModel):
    message: str = Field(..., min_length=1)
    source: str = "google_calendar"
    person_image_uri: str = "placeholder://person-image"
    person_image_metadata: dict[str, Any] = Field(default_factory=dict)


def _is_dress_upcoming_request(message: str) -> bool:
    lowered = message.lower()
    return "dress" in lowered and ("upcoming" in lowered or "events" in lowered)


@app.get("/health")
async def health() -> dict[str, str]:
    return {"status": "ok"}


@app.post("/api/agent/message")
async def agent_message(req: AgentMessageRequest):
    if not _is_dress_upcoming_request(req.message):
        return {
            "intent_recognized": False,
            "llm_used": False,
            "reply": "Ask me to dress you for your upcoming events to start the styling flow.",
            "next_step": "Example: 'Dress me for my upcoming events.'",
        }

    try:
        events = get_user_events(req.source)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))

    products = search_products(events)
    design_seed = make_design(
        products,
        person_image=Image(
            uri=req.person_image_uri,
            metadata=req.person_image_metadata,
        ),
    )
    localized_designs = [localize(design_seed, event) for event in events]
    try:
        llm_reply = await generate_styling_reply(
            req.message,
            events=events,
            products=products,
            localized_images=localized_designs,
        )
    except RuntimeError as exc:
        raise HTTPException(status_code=503, detail=str(exc))
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"GPT request failed: {exc}")

    return {
        "intent_recognized": True,
        "reply": llm_reply,
        "llm_used": True,
        "source": req.source,
        "events": [
            {
                "id": event.id,
                "title": event.title,
                "start": event.start.isoformat(),
                "end": event.end.isoformat(),
                "location": event.location,
                "dress_code": event.dress_code,
                "weather_hint": event.weather_hint,
                "style_keywords": event.style_keywords,
            }
            for event in events
        ],
        "products_by_event": products["products_by_event"],
        "all_products": products["all_products"],
        "localized_outfits": [
            {
                "event_id": event.id,
                "event_title": event.title,
                "image_uri": image.uri,
                "description": image.description,
                "metadata": image.metadata,
            }
            for event, image in zip(events, localized_designs)
        ],
    }


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
