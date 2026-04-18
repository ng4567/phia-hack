"""Phase 1 agents: Trend Research + Product Research + Orchestrator.

Built on Microsoft Agent Framework's ``RawAgent`` backed by
``AzureOpenAIChatClient``. The orchestrator delegates to sub-agents by
invoking them directly (the framework's ``agent.as_tool`` wiring is kept
simple in this first cut: the orchestrator just calls each sub-agent in
sequence with typed outputs so we can unit-test each stage).

Env vars expected (pulled by ``AzureOpenAIChatClient`` from ``.env``):
    AZURE_OPENAI_ENDPOINT
    AZURE_OPENAI_API_KEY
    AZURE_OPENAI_CHAT_DEPLOYMENT_NAME
    AZURE_OPENAI_API_VERSION
    TAVILY_API_KEY            (optional; disables web search if missing)
"""

from __future__ import annotations

import os
from typing import Any
from urllib.parse import urlparse

from agent_framework import RawAgent
from agent_framework.openai import OpenAIChatCompletionClient
from azure.identity.aio import (
    ChainedTokenCredential,
    ClientSecretCredential,
    DefaultAzureCredential,
    get_bearer_token_provider,
)
from openai import AsyncAzureOpenAI

from .retailers import POC_RETAILERS, retailer_summary
from .schemas import BoardItem, Product, ProductBoard, TrendBrief
from .shopify import get_product, list_new_arrivals
from .web_search import web_search

PREMIUM_DEPLOYMENT_ENV = "AZURE_OPENAI_CHAT_DEPLOYMENT_NAME"
COGNITIVE_SCOPE = "https://cognitiveservices.azure.com/.default"


def _normalize_azure_endpoint(endpoint: str) -> str:
    """Normalize user-provided Azure model endpoints to an OpenAI-compatible base.

    Common cases:
    - ``https://<name>.cognitiveservices.azure.com/`` -> unchanged
    - ``https://<name>.openai.azure.com/`` -> unchanged
    - ``https://<name>.services.ai.azure.com/models`` -> rewritten to
      ``https://<name>.cognitiveservices.azure.com/`` because the OpenAI client
      expects the Azure OpenAI / Cognitive Services data-plane endpoint.
    """
    raw = endpoint.strip()
    parsed = urlparse(raw)
    host = (parsed.netloc or parsed.path).rstrip("/")
    if not host:
        raise RuntimeError("Azure endpoint is empty.")
    if host.endswith(".services.ai.azure.com"):
        resource_name = host.split(".", 1)[0]
        return f"https://{resource_name}.cognitiveservices.azure.com/"
    if host.endswith(".cognitiveservices.azure.com") or host.endswith(
        ".openai.azure.com"
    ):
        return f"https://{host}/"
    raise RuntimeError(
        "Unsupported Azure endpoint host. Expected a *.cognitiveservices.azure.com, "
        "*.openai.azure.com, or *.services.ai.azure.com endpoint."
    )


def _build_credential() -> ChainedTokenCredential:
    """Prefer an explicit service principal if provided, else DefaultAzureCredential.

    Service-principal env vars (all three required to activate):
        AZURE_TENANT_ID, AZURE_CLIENT_ID, AZURE_CLIENT_SECRET

    Falls back to DefaultAzureCredential, which picks up az-cli login,
    managed identity, VS Code, etc.
    """
    credentials: list = []
    tenant = os.environ.get("AZURE_TENANT_ID")
    client_id = os.environ.get("AZURE_CLIENT_ID")
    client_secret = os.environ.get("AZURE_CLIENT_SECRET")
    if tenant and client_id and client_secret:
        credentials.append(
            ClientSecretCredential(
                tenant_id=tenant,
                client_id=client_id,
                client_secret=client_secret,
            )
        )
    credentials.append(DefaultAzureCredential(exclude_interactive_browser_credential=False))
    return ChainedTokenCredential(*credentials)


def _build_client() -> OpenAIChatCompletionClient:
    """Construct a shared chat client backed by AAD auth.

    Authenticates against Azure OpenAI / Foundry using a service principal
    (or DefaultAzureCredential fallback) — no API key required.
    """
    endpoint = os.environ.get("AZURE_OPENAI_ENDPOINT") or os.environ.get(
        "AZURE_AI_ENDPOINT"
    )
    if not endpoint:
        raise RuntimeError(
            "AZURE_OPENAI_ENDPOINT (or AZURE_AI_ENDPOINT) must be set to run the agents."
        )
    endpoint = _normalize_azure_endpoint(endpoint)
    deployment = os.environ.get(PREMIUM_DEPLOYMENT_ENV)
    if not deployment:
        raise RuntimeError(
            f"{PREMIUM_DEPLOYMENT_ENV} must be set to a Foundry/OpenAI chat deployment name."
        )
    api_version = os.environ.get("AZURE_OPENAI_API_VERSION", "2024-10-21")
    token_provider = get_bearer_token_provider(_build_credential(), COGNITIVE_SCOPE)
    async_client = AsyncAzureOpenAI(
        azure_endpoint=endpoint,
        azure_ad_token_provider=token_provider,
        api_version=api_version,
    )
    return OpenAIChatCompletionClient(model=deployment, async_client=async_client)


# ---------------------------------------------------------------------------
# Trend Research agent
# ---------------------------------------------------------------------------

TREND_INSTRUCTIONS = """\
You are the Trend Research agent for a high-end stylist. Given a question
about what is currently trending (city, season, demographic), you produce a
concise trend brief.

Rules:
- Call the `web_search` tool at least once for fresh context unless the
  stylist explicitly says "from memory".
- Prefer primary sources (Vogue, Business of Fashion, retailer press,
  editor street-style coverage). Avoid SEO farms.
- Every theme MUST include at least one citation when web_search returns
  results. If web_search returns an empty result set, set `notes` to
  explain that the brief is uncited.
- Keep briefs tight: 3-5 themes. Each theme: a short name, 2-3 sentence
  summary, a handful of silhouettes and colors, and citations.
- Return the final answer as JSON matching the TrendBrief schema.
"""


async def build_trend_agent(client: OpenAIChatCompletionClient) -> RawAgent:
    return RawAgent(
        client=client,
        name="trend-research",
        instructions=TREND_INSTRUCTIONS,
        tools=[web_search],
    )


async def run_trend_research(query: str) -> TrendBrief:
    client = _build_client()
    agent = await build_trend_agent(client)
    response = await agent.run(
        query,
        options={"response_format": TrendBrief, "temperature": 0.4},
    )
    parsed = _extract_structured(response, TrendBrief)
    return parsed


# ---------------------------------------------------------------------------
# Product Research agent
# ---------------------------------------------------------------------------

PRODUCT_INSTRUCTIONS = f"""\
You are the Product Research agent. You build a ranked board of products
that exemplify a given theme, drawn ONLY from the approved retailer
allowlist.

Approved retailers: {retailer_summary()}.

Rules:
- Use the `list_new_arrivals` tool to pull recent products from retailers
  the stylist asked about (or up to 3 sensible retailers if unspecified).
- Use `get_product` only if you need extra detail (sizes, full variant
  list).
- Select 8-15 items across retailers that best embody the requested
  theme. Diversify across retailers and price points.
- Write a one-sentence `rationale` per item tying it to the theme.
- Never invent products. Only include items returned by the tools.
- Return JSON matching the ProductBoard schema. Each BoardItem's
  `product` must be the exact Product object from the tool (copy all
  fields verbatim).
"""


# Tool wrappers that hide Pydantic objects from the LLM (it sees dicts)
async def tool_list_new_arrivals(
    retailer_id: str,
    collection: str | None = None,
    limit: int = 20,
) -> list[dict[str, Any]]:
    """List newest products for a retailer from the approved allowlist."""
    products = await list_new_arrivals(
        retailer_id, collection=collection, limit=limit
    )
    return [p.model_dump(mode="json") for p in products]


async def tool_get_product(retailer_id: str, handle: str) -> dict[str, Any]:
    """Fetch full detail for a single product by retailer + handle."""
    product = await get_product(retailer_id, handle)
    return product.model_dump(mode="json")


async def build_product_agent(client: OpenAIChatCompletionClient) -> RawAgent:
    return RawAgent(
        client=client,
        name="product-research",
        instructions=PRODUCT_INSTRUCTIONS,
        tools=[tool_list_new_arrivals, tool_get_product],
    )


async def run_product_research(
    query: str,
    *,
    retailer_ids: list[str] | None = None,
) -> ProductBoard:
    client = _build_client()
    agent = await build_product_agent(client)
    allow = retailer_ids or list(POC_RETAILERS)
    unknown = [r for r in allow if r not in POC_RETAILERS]
    if unknown:
        raise ValueError(f"Unknown retailers requested: {unknown}")
    prompt = (
        f"Theme / request: {query}\n"
        f"Use these retailers (ids): {', '.join(allow)}.\n"
        "Return the ProductBoard."
    )
    response = await agent.run(
        prompt,
        options={"response_format": ProductBoard, "temperature": 0.3},
    )
    return _extract_structured(response, ProductBoard)


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


def _extract_structured(response: Any, model_cls: type) -> Any:
    """Best-effort extraction of a Pydantic model from an AgentResponse.

    Agent Framework returns structured output in a few different shapes
    depending on the backend. We try the obvious attributes first and fall
    back to JSON-parsing the text.
    """
    # Direct typed value (e.g. response.value)
    for attr in ("value", "parsed", "output", "data"):
        candidate = getattr(response, attr, None)
        if isinstance(candidate, model_cls):
            return candidate
        if isinstance(candidate, dict):
            return model_cls.model_validate(candidate)
    text = getattr(response, "text", None) or str(response)
    import json

    return model_cls.model_validate(json.loads(text))


# ---------------------------------------------------------------------------
# Orchestrator (Phase 1): simple sequential coordination
# ---------------------------------------------------------------------------


async def run_research_session(
    trend_query: str,
    *,
    retailer_ids: list[str] | None = None,
) -> dict[str, Any]:
    """Run the Phase 1 pipeline end-to-end: trend brief -> product board.

    Phase 3 of the plan promotes this into a long-running, HITL-gated
    orchestrator. For now we return both artefacts in one shot so the UI
    can render them side by side.
    """
    brief = await run_trend_research(trend_query)
    theme_text = ", ".join(t.name for t in brief.themes)
    product_query = (
        f"Build a product board for the stylist's question: '{trend_query}'. "
        f"Recent trend themes: {theme_text}."
    )
    board = await run_product_research(product_query, retailer_ids=retailer_ids)
    return {
        "trend_brief": brief.model_dump(mode="json"),
        "product_board": board.model_dump(mode="json"),
    }
