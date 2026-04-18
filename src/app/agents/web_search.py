"""Web search tool for the Trend Research agent.

Wraps Tavily when ``TAVILY_API_KEY`` is set. If the key is missing the tool
returns a structured "unavailable" marker so the agent can still produce a
trend brief from its prior knowledge (flagged as uncited).
"""

from __future__ import annotations

import os
from typing import Any

try:  # soft-optional dep
    from tavily import TavilyClient
except ImportError:  # pragma: no cover
    TavilyClient = None  # type: ignore[assignment]


_TAVILY_CLIENT: Any | None = None


def _client() -> Any | None:
    global _TAVILY_CLIENT
    api_key = os.environ.get("TAVILY_API_KEY")
    if not api_key or TavilyClient is None:
        return None
    if _TAVILY_CLIENT is None:
        _TAVILY_CLIENT = TavilyClient(api_key=api_key)
    return _TAVILY_CLIENT


async def web_search(query: str, max_results: int = 5) -> dict[str, Any]:
    """Run a web search and return ``{"results": [{title,url,content}], "note": str}``.

    The Trend Research agent calls this for fresh context ("what's trending
    in NYC"). If Tavily isn't configured the tool returns an empty result
    set with a clear note so the agent can degrade gracefully.
    """
    client = _client()
    if client is None:
        return {
            "results": [],
            "note": (
                "Web search disabled (TAVILY_API_KEY not set). Generate the "
                "trend brief from prior knowledge and flag it as uncited."
            ),
        }
    max_results = max(1, min(max_results, 10))
    raw = client.search(query=query, max_results=max_results, search_depth="advanced")
    results = [
        {
            "title": item.get("title", ""),
            "url": item.get("url", ""),
            "content": (item.get("content") or "")[:1200],
        }
        for item in (raw.get("results") or [])
    ]
    return {"results": results, "note": ""}
