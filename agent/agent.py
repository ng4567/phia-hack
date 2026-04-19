# Copyright (c) Microsoft. All rights reserved.

from __future__ import annotations

import asyncio
import json
import os
from dataclasses import dataclass, field
from datetime import datetime
from pathlib import Path
from typing import Any, Sequence

from dotenv import load_dotenv

load_dotenv()

try:
    from agent_framework import Agent
    from agent_framework.foundry import FoundryChatClient
    from azure.identity import ClientSecretCredential
except ImportError:
    Agent = None
    FoundryChatClient = None
    ClientSecretCredential = None


DATA_DIR = Path(__file__).parent / "data"
CALENDAR_SOURCE_FILES = {
    "google": DATA_DIR / "google_calendar_events.json",
    "google_calendar": DATA_DIR / "google_calendar_events.json",
    "outlook": DATA_DIR / "outlook_calendar_events.json",
    "outlook_calendar": DATA_DIR / "outlook_calendar_events.json",
}

KEYWORD_PRODUCTS = {
    "tailored": ("Tailored Blazer", "Outerwear"),
    "statement jacket": ("Statement Cropped Jacket", "Outerwear"),
    "comfortable heels": ("Comfort Block Heels", "Shoes"),
    "romantic": ("Romantic Midi Dress", "Dress"),
    "pastels": ("Pastel Slip Dress", "Dress"),
    "block heels": ("Square-Toe Block Heels", "Shoes"),
    "light layers": ("Lightweight Duster", "Layer"),
    "structured": ("Structured Blazer", "Outerwear"),
    "polished": ("Silk Button-Up", "Top"),
    "neutral palette": ("Neutral Wide-Leg Trousers", "Bottom"),
    "minimal accessories": ("Minimal Gold Hoops", "Accessory"),
    "relaxed": ("Relaxed Linen Shirt", "Top"),
    "creative": ("Printed Midi Skirt", "Bottom"),
    "crossbody bag": ("Pebbled Leather Crossbody", "Accessory"),
    "walkable shoes": ("Leather Platform Sneakers", "Shoes"),
    "elegant": ("Elegant Column Dress", "Dress"),
    "dark florals": ("Dark Floral Wrap Dress", "Dress"),
    "dressy": ("Satin Evening Top", "Top"),
    "lightweight fabric": ("Lightweight Silk Blend Trousers", "Bottom"),
    "linen": ("Linen Two-Piece Set", "Set"),
    "capsule wardrobe": ("Capsule Neutral Tee", "Top"),
    "sun hat": ("Wide-Brim Sun Hat", "Accessory"),
    "layering pieces": ("Merino Layering Cardigan", "Layer"),
}


@dataclass(slots=True, frozen=True)
class CalEvent:
    id: str
    title: str
    category: str
    start: datetime
    end: datetime
    all_day: bool
    location: str
    dress_code: str
    weather_hint: str
    notes: str
    style_keywords: list[str]
    source: str


@dataclass(slots=True)
class Image:
    uri: str
    description: str = ""
    metadata: dict[str, Any] = field(default_factory=dict)


def _normalize_source(source: str) -> str:
    normalized = source.strip().lower()
    if normalized not in CALENDAR_SOURCE_FILES:
        raise ValueError(
            f"Unsupported source '{source}'. Use one of: google_calendar, outlook_calendar."
        )
    return normalized


def _load_events(source: str) -> list[dict[str, Any]]:
    source_key = _normalize_source(source)
    events_file = CALENDAR_SOURCE_FILES[source_key]
    with events_file.open("r", encoding="utf-8") as f:
        payload = json.load(f)
    return payload.get("events", [])


def _to_event(event_data: dict[str, Any], source: str) -> CalEvent:
    return CalEvent(
        id=str(event_data["id"]),
        title=str(event_data["title"]),
        category=str(event_data.get("category", "personal")),
        start=datetime.fromisoformat(str(event_data["start"])),
        end=datetime.fromisoformat(str(event_data["end"])),
        all_day=bool(event_data.get("all_day", False)),
        location=str(event_data.get("location", "")),
        dress_code=str(event_data.get("dress_code", "")),
        weather_hint=str(event_data.get("weather_hint", "")),
        notes=str(event_data.get("notes", "")),
        style_keywords=[str(keyword) for keyword in event_data.get("style_keywords", [])],
        source=source,
    )


def get_user_events(source: str) -> list[CalEvent]:
    event_rows = _load_events(source)
    events = [_to_event(row, _normalize_source(source)) for row in event_rows]
    return sorted(events, key=lambda evt: evt.start)


def _event_products(event: CalEvent) -> list[dict[str, str]]:
    lower_dress_code = event.dress_code.lower()
    lower_weather = event.weather_hint.lower()
    candidates: list[dict[str, str]] = []

    def add_product(name: str, category: str, reason: str) -> None:
        candidates.append({"name": name, "category": category, "reason": reason})

    if "formal" in lower_dress_code or "black tie" in lower_dress_code:
        add_product("Floor-Length Evening Dress", "Dress", "Matches a formal dress code.")
        add_product("Strappy Formal Heels", "Shoes", "Completes an evening-formal look.")
    elif "business" in lower_dress_code:
        add_product("Single-Breasted Blazer", "Outerwear", "Fits business-focused settings.")
        add_product("Pleated Tailored Trousers", "Bottom", "Keeps the outfit professional.")
    elif "casual" in lower_dress_code:
        add_product("Relaxed Cotton Tee", "Top", "Keeps the look casual and versatile.")
        add_product("Straight-Leg Denim", "Bottom", "Comfortable for a casual event.")

    if "rain" in lower_weather or "breezy" in lower_weather:
        add_product("Water-Resistant Trench", "Outerwear", "Adds weather-ready layering.")
    if "sunny" in lower_weather or "hot" in lower_weather:
        add_product("UV Sunglasses", "Accessory", "Useful for bright outdoor weather.")

    for keyword in event.style_keywords:
        key = keyword.lower()
        if key in KEYWORD_PRODUCTS:
            name, category = KEYWORD_PRODUCTS[key]
            add_product(name, category, f"Aligned to style keyword '{keyword}'.")

    unique: dict[str, dict[str, str]] = {}
    for product in candidates:
        unique.setdefault(product["name"], product)

    return list(unique.values())


def search_products(events: Sequence[str] | Sequence[CalEvent]) -> dict[str, Any]:
    if not events:
        return {"products_by_event": [], "all_products": []}

    normalized_events: list[CalEvent] = []
    for index, event in enumerate(events):
        if isinstance(event, CalEvent):
            normalized_events.append(event)
        else:
            normalized_events.append(
                CalEvent(
                    id=f"text_evt_{index}",
                    title=event,
                    category="personal",
                    start=datetime.now(),
                    end=datetime.now(),
                    all_day=False,
                    location="",
                    dress_code="",
                    weather_hint="",
                    notes=event,
                    style_keywords=[],
                    source="manual_input",
                )
            )

    products_by_event: list[dict[str, Any]] = []
    all_products_by_name: dict[str, dict[str, str]] = {}

    for event in normalized_events:
        products = _event_products(event)
        products_by_event.append(
            {
                "event_id": event.id,
                "event_title": event.title,
                "event_location": event.location,
                "products": products,
            }
        )
        for product in products:
            all_products_by_name.setdefault(product["name"], product)

    return {
        "products_by_event": products_by_event,
        "all_products": list(all_products_by_name.values()),
    }


def make_design(products: dict[str, Any], person_image: Image) -> Image:
    selected_products = [p["name"] for p in products.get("all_products", [])[:5]]
    if selected_products:
        description = f"Styled look featuring {', '.join(selected_products)}."
    else:
        description = "Styled look using clean silhouettes and event-appropriate layering."

    metadata = dict(person_image.metadata)
    metadata.update(
        {
            "selected_products": selected_products,
            "design_source": "google_calendar_events",
        }
    )

    return Image(uri=person_image.uri, description=description, metadata=metadata)


def localize(img: Image, event: CalEvent) -> Image:
    metadata = dict(img.metadata)
    metadata.update(
        {
            "event_id": event.id,
            "event_title": event.title,
            "event_location": event.location,
            "event_weather_hint": event.weather_hint,
        }
    )

    description = (
        f"{img.description} Localized for {event.title} at {event.location} "
        f"with {event.weather_hint.lower()} conditions."
    )
    return Image(uri=img.uri, description=description, metadata=metadata)


async def main() -> None:
    if Agent is None or FoundryChatClient is None or ClientSecretCredential is None:
        raise RuntimeError(
            "agent_framework and azure.identity must be installed to run the Foundry demo."
        )

    credential = ClientSecretCredential(
        tenant_id=os.getenv("AZURE_TENANT_ID"),
        client_id=os.getenv("AZURE_CLIENT_ID"),
        client_secret=os.getenv("AZURE_CLIENT_SECRET"),
    )

    client = FoundryChatClient(
        project_endpoint=os.getenv("AZURE_PROJECT_ENDPOINT"),
        model="gpt-5.4",
        credential=credential,
    )

    agent = Agent(
        client=client,
        name="HelloAgent",
        instructions="You are a friendly assistant. Keep your answers brief.",
    )

    result = await agent.run("dress me for my upcoming events")
    print(f"Agent: {result}")

    print("Agent (streaming): ", end="", flush=True)
    async for chunk in agent.run("Tell me a one-sentence fun fact.", stream=True):
        if chunk.text:
            print(chunk.text, end="", flush=True)
    print()


if __name__ == "__main__":
    asyncio.run(main())
