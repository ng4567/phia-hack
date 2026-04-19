import os
import sys
import importlib.util
from pathlib import Path
from typing import Any

import uvicorn
from dotenv import load_dotenv
from fastapi import FastAPI, File, HTTPException, UploadFile
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

app = FastAPI(title="Style-Me Virtual Try-On")


class AgentMessageRequest(BaseModel):
    message: str = Field(..., min_length=1)
    source: str = "google_calendar"
    person_image_uri: str = "placeholder://person-image"
    person_image_metadata: dict[str, Any] = Field(default_factory=dict)


def _is_dress_upcoming_request(message: str) -> bool:
    lowered = message.lower()
    return "dress" in lowered and ("upcoming" in lowered or "events" in lowered)


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
