# Style-Me Research & Design Agent — Architecture Plan

## 1. Goal

Automate the trend-research → decision → design loop that a human stylist
currently runs manually. The stylist stays in control at decision points; the
agent does the expensive busywork (browsing, extracting, ranking, try-on
generation, lookbook assembly).

## 2. Target UX (five beats)

1. **Trend question** — stylist: *"What's trending in NYC right now?"* Agent
   returns a concise, cited trend brief (themes, silhouettes, colors, example
   looks).
2. **Deep research** — stylist: *"Dig into the 'quiet luxury revival' theme
   across Zara, COS, and Reformation's new drops."* Agent scrapes catalogs,
   extracts product data, clusters by theme, returns a ranked product board
   with images, prices, and links.
3. **Stylist decision** — stylist reviews, edits, removes items, and picks a
   direction. UI = a web board with approve/reject + free-text notes.
4. **Implementation request** — stylist: *"Great — make looks for my clients
   who'd like this."*
5. **Per-client design** — agent loads the stylist's philosophy doc + each
   client's profile, selects + combines garments, runs FASHN try-on, produces
   a per-client lookbook, and returns everything for final stylist approval
   before sending to clients.

## 3. Decision: Tools vs. Multi-Agent

**Recommendation: hybrid — one orchestrator agent + a small number of
specialist sub-agents, each backed by typed tools.**

Pure-tools (single agent with 15 tools) is simpler but has two problems at
this scope:

- **Context bloat.** A single agent accumulates scraped HTML, product JSON,
  client profiles, and try-on URLs in one window. It will hit context limits
  and get confused about which step it's in.
- **Prompt coupling.** Research prompting and design prompting want very
  different system instructions (journalistic vs. taste-driven).

Pure multi-agent (5+ agents chatting) is overkill and hard to debug.

The hybrid boundaries:

| Agent | Responsibility | Why separate |
|---|---|---|
| **Orchestrator** | Owns the conversation with the stylist, plans phases, delegates, enforces HITL gates. | Stable system prompt, small context, routes work. |
| **Trend Research Agent** | Open-web search → trend brief with citations. | Needs web-search tools + journalistic prompt. |
| **Product Research Agent** | Site-specific catalog scraping → structured product list. | Different tools (Firecrawl/Apify) + extraction schema. |
| **Matching & Design Agent** | Reads stylist philosophy + client profile → selects garments, composes outfits, calls try-on. | Taste-heavy prompt; runs per client, parallelizable. |
| **Lookbook Agent** *(optional, can start as a tool)* | Renders HTML/PDF deliverable. | Purely mechanical; start as a tool, promote if it grows. |

Everything *inside* an agent is plain tools. Sub-agents are exposed to the
orchestrator as tools too (Microsoft Agent Framework supports
"agent-as-tool"), so the orchestrator's planning surface stays uniform.

Rule of thumb we'll follow: **promote a tool to an agent only when it needs
its own memory, its own system prompt, or multi-step reasoning.** Otherwise
it stays a tool.

## 4. High-Level Architecture

```
 Stylist (web UI)
      │  (chat + approve/reject)
      ▼
 FastAPI  ──►  Job Queue (Arq + Redis)
      │                │
      │                ▼
      │        Orchestrator Agent  ◄── session state (Postgres/SQLite)
      │           │     │     │
      │           ▼     ▼     ▼
      │     Trend   Product   Matching&Design (fan-out per client)
      │     Agent    Agent          │
      │       │        │            ▼
      │       │        │       virtual_tryon_cached (FASHN)
      │       ▼        ▼
      │   web search  Firecrawl/Apify
      ▼
 WebSocket / SSE stream of progress + artifacts
```

Key properties:

- **Async end-to-end.** Every step is a background job; UI subscribes over
  SSE/WebSocket. Nothing blocks the HTTP request.
- **Checkpointing.** After each phase (trend brief, product board,
  per-client designs) the orchestrator persists artifacts and pauses for
  stylist input. This is the HITL gate.
- **Deterministic storage.** Agents don't hold state in their prompts across
  turns; they read/write from the session store.

## 5. Microsoft Agent Framework Mapping

Library: `microsoft-agentframework` (Python).

- `ChatAgent` per role, each with its own `instructions` and `tools` list.
- `AzureOpenAIChatClient` (or `FoundryClient`) as the model backend, pointed
  at Microsoft Foundry deployments.
- Use `@ai_function` (or the `Tool.from_function` helper) to expose Python
  functions as tools with typed signatures — the framework generates the
  JSON schema automatically.
- Expose sub-agents to the orchestrator via `agent.as_tool(name, description)`
  so the orchestrator plans in one flat tool namespace.
- Use the framework's **thread / chat history** abstraction per session so
  the stylist's conversation persists across HITL pauses.
- Use **structured output** (`response_format=Pydantic model`) for every
  agent that returns data the next stage consumes (trend brief, product
  list, per-client design plan). No free-form JSON parsing.
- Use **parallel tool calls** for product scraping and per-client design
  fan-out.
- Tracing: enable OpenTelemetry export (framework has built-in hooks) →
  Foundry traces or Langfuse.

## 6. Agents, Prompts, and Tools

### 6.1 Orchestrator Agent

- **Instructions (sketch):** "You coordinate a stylist's research and
  design workflow. You never browse the web or design outfits yourself —
  you call specialist agents. You always pause for stylist approval before
  moving from research to design, and before sending anything to clients."
- **Tools exposed:**
  - `get_stylist_profile(stylist_id) -> Stylist`
  - `list_clients(stylist_id) -> list[Client]`
  - `get_client_profile(client_id) -> Client`
  - `save_artifact(session_id, kind, payload)` — persists trend brief,
    product board, designs.
  - `request_stylist_approval(session_id, artifact_id, prompt) -> Pending` —
    pauses the job until the UI posts approval.
  - `trend_research_agent` *(as tool)*
  - `product_research_agent` *(as tool)*
  - `matching_design_agent` *(as tool, invoked per client, in parallel)*
  - `render_lookbook(designs) -> lookbook_url`

### 6.2 Trend Research Agent

- **Instructions:** journalistic, cite-or-die, no hallucinations, prefer
  primary sources (Vogue, Business of Fashion, retailer press pages,
  Instagram/TikTok trend reports). Output must match a `TrendBrief` schema.
- **Tools:**
  - `web_search(query, freshness="week")` — Tavily or Exa (LLM-optimized).
    Bing Web Search is the fallback.
  - `fetch_url(url) -> markdown` — Firecrawl `/scrape`.
  - `search_social(query, platform)` *(optional v2)* — RapidAPI TikTok/IG.
- **Output schema (`TrendBrief`):** `themes[]` where each theme has
  `name`, `summary`, `key_silhouettes`, `key_colors`, `example_image_urls`,
  `citations[]`.

### 6.3 Product Research Agent

- **Instructions:** Given a list of retailers + a theme, find concrete
  products that exemplify the theme. Return a `ProductBoard`.
- **Tools:**
  - `firecrawl_search(site, query)` — scoped search within a domain.
  - `firecrawl_crawl(url, max_pages)` — for "new arrivals" pages.
  - `firecrawl_scrape(url)` — single product page.
  - `extract_product(markdown|html) -> Product` — prefers Schema.org
    microdata (`extruct`), LLM fallback with structured output.
  - `normalize_garment_image(url) -> url` — background removal via
    `rembg` or Remove.bg; stored in Azure Blob / S3.
  - `tag_product_vision(image_url) -> ProductTags` — Foundry vision model:
    `{category, silhouette, color_family, formality, season, materials}`.
- **Output schema (`ProductBoard`):** `products[] = {id, name, brand,
  url, price, currency, sizes[], image_url, garment_image_url, tags,
  source_theme}`.

### 6.4 Matching & Design Agent (runs per client)

- **Instructions:** "You are styling for <client>. Read their profile and
  the stylist's philosophy. Select 3–5 outfits from the product board that
  fit both. Justify each choice in one sentence. Respect hard constraints
  (budget, size availability, material no-gos)."
- **Tools:**
  - `get_stylist_philosophy(stylist_id) -> str` — loads the stylist's
    philosophy doc (markdown in Stylist.metadata or a separate blob).
  - `get_client_profile(client_id) -> Client`
  - `filter_products_hard(board, client) -> board` — deterministic Python,
    not an LLM call (budget, size, dislikes).
  - `rank_products(board, client, philosophy) -> ranked` — LLM call with
    structured output, small context.
  - `compose_outfit(products[], client) -> Outfit` — LLM proposes
    top+bottom+outer+shoes combinations.
  - `try_on(client.photo_path, garment_image_url) -> design_image_urls` —
    wraps existing `virtual_tryon_cached`.
  - `save_design(client_id, design)` — uses existing
    `Stylist.add_design_for_client`.
- **Output schema (`ClientDesignSet`):** `client_id`, `outfits[]` each with
  `products[]`, `tryon_image_urls[]`, `rationale`.

### 6.5 Lookbook (tool, not agent to start)

- Jinja2 template → HTML → optional WeasyPrint PDF → uploaded to blob →
  URL returned. Promote to an agent only if stylists start asking for
  layout customization.

## 7. Data Model Additions

Extend `src/app/utils.py` (keep dataclasses, or migrate to SQLModel when
persistence is added):

```python
@dataclass
class StylistPhilosophy:
    stylist_id: str
    markdown: str           # free-form doctrine
    brand_voice: str        # short tagline
    color_palette: list[str]
    avoid: list[str]        # e.g. "logo-heavy", "fast fashion"

@dataclass
class ClientPreferences:    # lives in Client.metadata today
    sizes: dict[str, str]   # {"top": "M", "bottom": "28", "shoe": "9"}
    budget_max: Optional[int]
    palette_likes: list[str]
    palette_dislikes: list[str]
    materials_avoid: list[str]
    body_notes: str

@dataclass
class ResearchSession:
    id: str
    stylist_id: str
    created_at: datetime
    status: str             # "researching" | "awaiting_approval" | "designing" | "done"
    trend_brief: Optional[TrendBrief]
    product_board: Optional[ProductBoard]
    design_sets: list[ClientDesignSet]
    approvals: list[ApprovalEvent]
```

Persistence: start with SQLite (you already use it for the try-on cache).
Move to Postgres when you add multi-tenant auth.

## 8. New FastAPI Surface

```
POST   /api/agents/sessions                 # start a research session
POST   /api/agents/sessions/{id}/messages   # stylist message → orchestrator
GET    /api/agents/sessions/{id}/stream     # SSE: progress + artifacts
POST   /api/agents/sessions/{id}/approve    # resume pending HITL gate
GET    /api/agents/sessions/{id}/artifacts  # trend brief / board / designs
POST   /api/agents/sessions/{id}/designs/{design_id}/publish  # to client
```

Background runner: Arq (async Redis queue) jobs invoke the orchestrator;
progress events stream back over SSE.

## 9. External Integrations (MVP)

| Need | Pick | Alt |
|---|---|---|
| Open-web trend search | **Tavily** | Exa, Brave, Bing |
| Catalog scraping | **Firecrawl** | Apify (per-site actors), Browserbase |
| Product data extraction | **Foundry LLM + structured output** | `extruct` for Schema.org |
| Vision tagging | **Foundry vision (GPT-4o/Claude/Phi-vision)** | `fashion-clip` |
| Background removal | **rembg** (local) | Remove.bg API |
| Try-on | **FASHN via fal** (already wired) | — |
| Affiliate/purchase (v2) | **ShopStyle Collective**, **Rye** | RewardStyle |
| Storage | **Azure Blob** | S3 |
| Queue | **Arq + Redis** | Celery |
| Tracing | **Foundry OTel** | Langfuse, Phoenix |

Note on Bing: for *site-specific* catalog browsing you don't need it —
Firecrawl is better. Keep Bing/Tavily for open-ended trend questions.

## 10. HITL Gates

Three hard gates; the orchestrator will not cross them without a stylist
action:

1. **After trend brief** — stylist picks which themes to deepen.
2. **After product board** — stylist approves/rejects items and picks
   which clients the designs are for.
3. **Before sending designs to clients** — stylist reviews the per-client
   lookbooks.

Implementation: `request_stylist_approval` writes a `pending_approval`
row, sends an SSE event, and the Arq job awaits an asyncio future keyed by
`session_id`. The approval endpoint resolves the future.

## 11. Caching & Cost Controls

- **Scrape cache** — key by URL + ISO-week in the existing SQLite schema.
  Avoid re-scraping Zara's new arrivals twice in a day.
- **Try-on cache** — already implemented; reuse.
- **Embedding cache** — if/when CLIP is added.
- **Hard budget per session** — max N web fetches, max M try-ons. Enforced
  in tool wrappers, not in the prompt.
- **Model tiering** — cheap model (e.g. GPT-4o-mini / Phi) for extraction
  and filtering; premium model for trend synthesis and outfit composition.

## 12. Observability

- OTel traces from Agent Framework → Foundry.
- Log every tool call with inputs, outputs, latency, token cost into the
  session record; surface this in a `/debug` panel.
- Add structured LLM-judge evals on trend briefs and design rationales;
  run nightly on a fixture set.

## 13. Safety & Trust

- Every external image/URL is validated (MIME, size, domain allowlist
  for retailers before we save).
- Affiliate links and outbound client comms are **always** behind an
  approval gate.
- Rate-limit scrapers per domain; respect robots.txt; back off on 403/429.
- Never persist client photos outside the stylist's tenant scope.

## 14. Phased Delivery

**Phase 1 — Trend → Product Board (no designs yet).**
- Orchestrator + Trend Agent + Product Agent.
- Tools: Tavily, Firecrawl, extractor, vision tagger.
- Deliverable: a web view of the product board with citations.

**Phase 2 — Per-Client Designs.**
- Matching & Design Agent + stylist philosophy loader.
- Wire `virtual_tryon_cached` as a tool.
- Deliverable: per-client lookbook HTML.

**Phase 3 — Approvals, SSE, Arq.**
- Move long work off the request thread; add HITL gates and streaming.

**Phase 4 — Polish.**
- Affiliate links (ShopStyle/Rye), PDF lookbooks, email delivery,
  embedding-based personalization, evals.

## 15. Open Questions (to resolve before building)

1. Where does the stylist's **philosophy document** live? Upload → blob,
   or markdown in `Stylist.metadata`? - local md.file that will be hard coded
2. Is client approval of final looks required, or only stylist approval? - stylist makes the design and send to the client, client does whatever they want with it
3. Which retailers are the v1 allowlist? — **Resolved. See §16.**
4. Do we need real purchase integration in v1, or is "here's the buy link" enough? - put the buy button as linking to the actual product, phia's chrome extension will show up there
5. Multi-tenant auth story — are we launching with a single stylist
account or multi-tenant from day one? - single stylist account

## 16. POC Retailer Allowlist (scraping reality check)

We probed a set of candidate retailers to see what a simple agent-friendly
scraper can actually pull. The test was a plain `curl` with a desktop User-
Agent against (a) a product page (looking for Schema.org `Product` JSON-LD)
and (b) the Shopify `/products.json` and `/collections/<handle>/products.json`
endpoints, which return clean JSON without any scraping.

### Probe results

| Retailer | Product page | Shopify `/products.json` | Shopify collection feed | Verdict |
|---|---|---|---|---|
| **Allbirds** | 200, 2× ld+json, Product found | 200 | 200 (`womens-new-arrivals`) | ✅ Easy |
| **Everlane** | 200, 2× ld+json, Product found | 200 | 200 (`womens-new-arrivals`) | ✅ Easy |
| **Kith** | — | 200 | 200 (`womens-new-arrivals`) | ✅ Easy |
| **Naked Wolfe** | — | 200 | 200 (`new-arrivals`) | ✅ Easy |
| **Princess Polly** | — | 200 | — | ✅ Easy |
| **Frank And Oak** | — | 200 | — | ✅ Easy |
| **Tentree** | — | 200 | — | ✅ Easy |
| **Outdoor Voices** | — | 200 | — | ✅ Easy |
| **Marine Layer** | — | 200 | — | ✅ Easy |
| **Taylor Stitch** | — | 200 | — | ✅ Easy |
| Reformation | 200, ld+json Product | 404 | 404 | ⚠️ Medium (scrape HTML ld+json) |
| Uniqlo | 200 but JS-rendered, no ld+json in static HTML | n/a | n/a | ⚠️ Hard (needs Firecrawl/headless) |
| Nordstrom | 200 but JS-rendered | n/a | n/a | ⚠️ Hard |
| Zara | 200 but 2 KB JS shell | n/a | n/a | ⚠️ Hard |
| H&M | **403** | n/a | n/a | ❌ Blocked |
| COS | **403** | n/a | n/a | ❌ Blocked |
| Aritzia | **403 + Cloudflare challenge** | n/a | n/a | ❌ Blocked |
| SSENSE | Cloudflare challenge | n/a | n/a | ❌ Blocked |
| Revolve | TLS stream reset | n/a | n/a | ❌ Blocked |
| Net-a-Porter | TLS stream reset | n/a | n/a | ❌ Blocked |

### POC allowlist (hard-coded)

Only Shopify storefronts with publicly-accessible JSON product feeds. No
headless browser, no third-party scraping API required for v1.

```python
POC_RETAILERS = [
    {
        "id": "allbirds",
        "name": "Allbirds",
        "base": "https://www.allbirds.com",
        "collections": {
            "womens_new": "womens-new-arrivals",
            "mens_new": "mens-new-arrivals",
        },
    },
    {
        "id": "everlane",
        "name": "Everlane",
        "base": "https://www.everlane.com",
        "collections": {
            "womens_new": "womens-new-arrivals",
            "mens_new": "mens-new-arrivals",
        },
    },
    {
        "id": "kith",
        "name": "Kith",
        "base": "https://kith.com",
        "collections": {
            "womens_new": "womens-new-arrivals",
            "mens_new": "mens-new-arrivals",
        },
    },
    {
        "id": "naked_wolfe",
        "name": "Naked Wolfe",
        "base": "https://www.nakedwolfe.com",
        "collections": {"new": "new-arrivals"},
    },
    {
        "id": "princess_polly",
        "name": "Princess Polly",
        "base": "https://www.princesspolly.com",
        "collections": {"new": "new"},   # to confirm handle
    },
    {
        "id": "frank_and_oak",
        "name": "Frank And Oak",
        "base": "https://www.frankandoak.com",
        "collections": {"new": "new-arrivals"},
    },
    {
        "id": "tentree",
        "name": "Tentree",
        "base": "https://www.tentree.com",
        "collections": {"new": "new-arrivals"},
    },
    {
        "id": "outdoor_voices",
        "name": "Outdoor Voices",
        "base": "https://www.outdoorvoices.com",
        "collections": {"new": "new-arrivals"},
    },
    {
        "id": "marine_layer",
        "name": "Marine Layer",
        "base": "https://www.marinelayer.com",
        "collections": {"new": "new-arrivals"},
    },
    {
        "id": "taylor_stitch",
        "name": "Taylor Stitch",
        "base": "https://www.taylorstitch.com",
        "collections": {"new": "new-arrivals"},
    },
]
```

### Scraping tool for the POC

Instead of Firecrawl/Apify, the POC ships a single tool:

```python
async def shopify_list_new_arrivals(retailer_id: str, limit: int = 30) -> list[Product]:
    """GET {base}/collections/{handle}/products.json?limit={limit}.
    Normalize each product into our Product schema (id, title, handle,
    vendor, product_type, tags, url, image_url, price, currency, sizes).
    """
```

And a companion:

```python
async def shopify_get_product(retailer_id: str, handle: str) -> Product:
    """GET {base}/products/{handle}.json for full detail (variants, sizes)."""
```

That's the entire scraping surface for v1. No HTML parsing, no headless
browser, no bot-protection workarounds.

### Behavior when stylist asks about a blocked retailer

If the stylist says *"search Zara's new collection"*, the orchestrator
should:

1. Detect the requested retailer is not in `POC_RETAILERS`.
2. Respond: *"Zara isn't wired up in this build. I can pull new arrivals
   from: Allbirds, Everlane, Kith, Naked Wolfe, Princess Polly, Frank And
   Oak, Tentree, Outdoor Voices, Marine Layer, Taylor Stitch. Which should
   I use?"*
3. Offer an override: manual URL → Firecrawl fallback (behind a feature
   flag, not default).

### Notes / caveats

- Shopify `/products.json` is paginated (`?page=N&limit=250`), max 250 per
  page. For "new arrivals" this is almost always enough.
- These endpoints don't expose inventory counts by default; size
  availability comes from variant `available` field on `/products/{handle}.json`.
- Re-verify a couple of the less-prominent brands (Princess Polly
  collection handle, Kotn) during implementation — they were probed only
  at `/products.json`, not at a named collection.
- Robots.txt was generally permissive for `/products.json` on the
  Shopify brands; we'll still hit with a descriptive User-Agent and a
  1-req/sec rate limit per domain.
