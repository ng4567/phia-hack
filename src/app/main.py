import os
from pathlib import Path

import uvicorn
from dotenv import load_dotenv
from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

from app.utils import virtual_tryon_cached
from app.agents.orchestrator import (
    run_product_research,
    run_research_session,
    run_trend_research,
)
from app.agents.retailers import POC_RETAILERS
from app.agents.shopify import list_new_arrivals
from pydantic import BaseModel

REPO_ROOT = Path(__file__).resolve().parents[2]
load_dotenv(REPO_ROOT / ".env")

STATIC_DIR = Path(__file__).parent / "static"

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


if STATIC_DIR.is_dir():
    app.mount("/static", StaticFiles(directory=STATIC_DIR), name="static")


# ---------------------------------------------------------------------------
# Phase 1 agent endpoints
# ---------------------------------------------------------------------------


class TrendRequest(BaseModel):
    query: str


class ProductRequest(BaseModel):
    query: str
    retailer_ids: list[str] | None = None


class ResearchRequest(BaseModel):
    query: str
    retailer_ids: list[str] | None = None


@app.get("/api/agents/retailers")
async def api_retailers():
    return {
        "retailers": [
            {"id": r.id, "name": r.name, "collections": list(r.collections)}
            for r in POC_RETAILERS.values()
        ]
    }


@app.get("/api/agents/retailers/{retailer_id}/new-arrivals")
async def api_new_arrivals(
    retailer_id: str,
    collection: str | None = None,
    limit: int = 20,
):
    try:
        products = await list_new_arrivals(
            retailer_id, collection=collection, limit=limit
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=502, detail=str(e))
    return {"products": [p.model_dump(mode="json") for p in products]}


@app.post("/api/agents/trend")
async def api_trend(req: TrendRequest):
    try:
        brief = await run_trend_research(req.query)
    except RuntimeError as e:
        raise HTTPException(status_code=500, detail=str(e))
    return brief.model_dump(mode="json")


@app.post("/api/agents/product-board")
async def api_product_board(req: ProductRequest):
    try:
        board = await run_product_research(req.query, retailer_ids=req.retailer_ids)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except RuntimeError as e:
        raise HTTPException(status_code=500, detail=str(e))
    return board.model_dump(mode="json")


@app.post("/api/agents/research")
async def api_research(req: ResearchRequest):
    try:
        return await run_research_session(req.query, retailer_ids=req.retailer_ids)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except RuntimeError as e:
        raise HTTPException(status_code=500, detail=str(e))


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
