# Phia Hack 2026 — Stylist Portfolio App

Context document for Claude Code. Read this first before writing any code.

---

## What we're building

**Phia for Stylists** — a two-sided app where professional stylists build outfit boards for individual clients, and clients view their looks with virtual try-on previews and Phia-sourced affordable pricing for every item.

**The pitch:**
> "Phia tells you *where* to buy it cheapest. We tell you *whether you should buy it at all* — by showing you on your body, built by a stylist who knows you, for the life you actually live."

**The "wow" demo moment:** stylist drags 5 garments onto a board for client "Sarah" → click Generate → 8 seconds later, Sarah appears wearing the full look (via FASHN) with every item priced by Phia at the cheapest version across 40,000+ retail and resale sites.

## Context that matters

- This is a 24-hour hackathon at Phia HQ in NYC, April 18–19, 2026.
- The judges built Phia. Assume they know their own product cold. Leverage their primitives (image→item identification, price matching across retail/resale) as infrastructure, don't reimplement them.
- Presentation is 3 min + 2 min Q&A on Sunday at 1 PM.
- Track: **Personalized Shopping** (primary) with elements of Autonomous Agents.

## My role

**I am only writing the frontend.** My teammate handles:
- Backend API (whatever we need — probably Next.js API routes or a lightweight Express/FastAPI service)
- FASHN API integration (server-side, to hide the key and handle async polling)
- Phia API integration / price lookup
- Data persistence (if any — could be in-memory or a JSON file for hackathon scale)

My contract with my teammate is the **API shape** (see "Data contracts" below). I should build against mocked data first so I'm not blocked on their work.

---

## Tech stack

Default choices unless I say otherwise:

- **Next.js 15 (App Router) + TypeScript** — familiar, handles routing cleanly, easy to drop in API proxy routes later if needed
- **Tailwind CSS** — fast styling, no CSS debates
- **shadcn/ui** — drop-in component primitives (Button, Dialog, Card, Input, etc.), consistent aesthetic
- **Framer Motion** — for outfit board drag interactions and look transitions (demo polish matters)
- **Zustand** — lightweight global state (client list, active look, etc.). Don't reach for Redux.
- **Lucide icons** — already pairs with shadcn

**Do not add:**
- Auth (hardcode one stylist, two clients — judges don't care)
- Database layer (mock JSON, teammate can wire real backend later)
- Testing framework (hackathon — ship it)
- Storybook, i18n, analytics, error monitoring

## Core user flows

### Flow 1 — Stylist builds a look (primary demo flow)

1. Stylist lands on **Dashboard** → sees 2 hardcoded clients (e.g., "Sarah Chen" and "Maya Rodriguez") with profile photo, last-updated timestamp, # of looks
2. Click Sarah → **Client Detail** page: Sarah's photo, sizing notes, existing looks grid, "+ New Look" button
3. Click New Look → **Look Builder** split view:
   - **Left (40%)**: garment search/library. Stylist can paste a product URL or search a pre-seeded catalog of ~20 items. Drag items onto the board.
   - **Right (60%)**: outfit board. Dropped items stack vertically with drag-to-reorder. Below the board: "Generate Try-On" button.
4. Click Generate → loading state ("Sarah is getting dressed..." or similar playful copy) → FASHN renders full look on Sarah (5–17s real, but we'll pre-cache for demo)
5. Result view: Sarah wearing the look, each item beside her with Phia's cheapest price + original retail + savings badge. "Share with Sarah" button.

### Flow 2 — Client views their look (secondary, for completeness)

1. Client opens a shareable link → **Client View** of the look
2. Sees themselves in the outfit (FASHN output), each item shoppable with Phia pricing
3. "Love it" / "Not for me" buttons, optional note back to stylist
4. Buy Now links out (mock for hackathon)

## Components to build (priority order)

Build top-to-bottom. Don't jump around.

1. **App shell + routing** (Dashboard, Client Detail, Look Builder, Look Result, Client View)
2. **ClientCard** — avatar, name, looks count (dashboard grid)
3. **GarmentTile** — product image, name, brand, retail price (used in search panel + outfit board)
4. **OutfitBoard** — drag-and-drop container (use `@dnd-kit/core`, not react-dnd — better App Router support)
5. **LookResult** — side-by-side try-on image + item pricing breakdown
6. **PriceBadge** — shows Phia's price with savings %, pulls visual style from Phia's own app (editorial/clean)
7. **TryOnLoader** — branded loading state for the FASHN wait (this is the demo moment, make it feel intentional)
8. **ShareModal** — copy link for client view

## Data contracts

These are the shapes I'm expecting from my teammate. I'll mock them in `/lib/mock-data.ts` until real endpoints exist.

```typescript
type Client = {
  id: string;
  name: string;
  photoUrl: string;         // reference photo for FASHN try-on
  sizing: { top: string; bottom: string; shoe: string };
  notes: string;            // stylist's free-text notes
  looks: Look[];
};

type Garment = {
  id: string;
  name: string;
  brand: string;
  category: 'top' | 'bottom' | 'one-piece' | 'outerwear' | 'shoes' | 'accessory';
  retailPrice: number;
  retailUrl: string;
  imageUrl: string;
  photoType: 'flat-lay' | 'on-model';  // FASHN needs this hint
  phiaMatch?: PhiaMatch;    // populated after Phia lookup
};

type PhiaMatch = {
  lowestPrice: number;
  source: string;           // "The RealReal", "Poshmark", etc.
  sourceUrl: string;
  condition: 'new' | 'like-new' | 'good' | 'fair';
  savingsPercent: number;
};

type Look = {
  id: string;
  clientId: string;
  createdAt: string;
  occasion?: string;        // "weekend brunch", "first date", etc.
  garments: Garment[];
  tryOnImageUrl?: string;   // FASHN output, undefined until generated
  status: 'draft' | 'generating' | 'ready' | 'shared';
};
```

## FASHN integration notes (for awareness; backend owns the call)

Backend will expose:
- `POST /api/looks/:id/generate` → kicks off FASHN job, returns `{ jobId }`
- `GET /api/looks/:id/status` → polling endpoint, returns `{ status, tryOnImageUrl? }`

Frontend should:
- Poll every 2s after clicking Generate, max 30s timeout
- Show the loader with progress copy that changes every few seconds
- **For the demo, pre-generate all hero try-ons.** Backend will return the cached image URL instantly. Live generation is a stretch goal, not a demo requirement. This is the single most important decision in this doc — do not let a 12-second API wait kill our pitch.

## Phia integration notes

Backend will call Phia's API to match each garment against their 250M+ item database (40,000+ retail and resale sites — RealReal, Vestiaire, ThredUp, StockX, eBay, Poshmark, etc.). Frontend receives the `phiaMatch` field pre-populated on each Garment.

If teammate can't get real Phia API access in time, mock realistic data — typical secondhand savings are 30–70% off retail.

## Design direction

Phia's own aesthetic is editorial, clean, quiet — "Vogue meets Glossier." Match that energy:

- **Palette:** off-white background, warm charcoal text, one accent color (consider a muted sage or soft coral — not aggressive brand colors)
- **Typography:** a serif display face for headings (Fraunces, GT Sectra, or similar free option), clean sans for body (Inter)
- **Generous whitespace.** Think fashion editorial, not SaaS dashboard.
- **Soft shadows, 8–12px radius, no hard borders**
- **Photography-first layouts** — let garment and client images breathe
- **Micro-interactions matter.** Drag feedback, try-on reveal animation, price count-up when Phia savings appear. Framer Motion for all of it.

Do not use:
- Gradient buttons
- Emoji in the UI (keep it grown-up)
- Dark mode (hackathon scope)
- Any stock "dashboard" template aesthetic

## Demo strategy

The pitch goes: (1) problem, (2) live demo, (3) vision. The live demo is 90 seconds max. It must go:

1. Dashboard → pick Sarah (already styled by stylist "Jess")
2. "Here's the look Jess built for Sarah's rooftop engagement party next weekend"
3. Click into the look → instant FASHN result (pre-cached)
4. Zoom on the pricing breakdown → "Jess picked a $495 Reformation dress. Phia found it on Vestiaire for $180. Across the full look — $1,240 retail, $430 Phia. That's Sarah's entire outfit for less than the dress alone."
5. "And Sarah sees this view" → flip to client view for 10 seconds
6. Back to the vision slide

Pre-cache at least **3 complete looks** on Sarah and **2 on Maya** the night before. Hardcode paths. Test the demo flow end-to-end on the actual presentation laptop Saturday night.

## What NOT to do

- Don't build anything until you've read this doc and confirmed understanding
- Don't build sign-up, login, password reset, or any auth
- Don't build a settings page
- Don't build stylist onboarding
- Don't build payment or checkout (link out with a mock Buy button)
- Don't build notifications, messaging, or real-time sync
- Don't build a mobile-responsive view unless time remains — desktop demo only
- Don't try to make FASHN calls from the frontend directly. Backend proxies.
- Don't invent new data shapes. If something's missing from the contract above, flag it before adding.

## Stretch goals (only if we ship MVP with 6+ hours left)

In rough priority:

1. **Occasion prompt** → stylist types "rooftop wedding, July, Charleston" and an AI agent suggests 3 garments to add to the board (uses Phia's identification + a taste model)
2. **Budget slider** → stylist sets $300 cap, agent automatically swaps items to hit it while preserving the vibe
3. **Closet integration** → Sarah uploads 5 pieces she owns; stylist sees them as palette items that pair-with suggestions
4. **Client reaction flow** → Sarah "loves" items and the stylist sees it live
5. **Style DNA** → aggregate Sarah's loved looks into a vibe profile for future styling

Don't start any stretch work until the core demo runs cleanly end-to-end twice in a row.

---

## First action

Before writing code: confirm you've read this, ask about anything unclear, then propose a file structure for the Next.js app. Wait for approval before scaffolding.