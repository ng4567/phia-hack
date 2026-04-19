# Design: Two-sided stylist ↔ client app with AI-enriched context

## Context

Hackathon goal: demo a stylist-assisted shopping product where a client
messages their stylist in-app, the stylist sees AI-enriched context pulled
from the client's "connected" Gmail / Google Calendar / Outlook, curates a
look from the existing Phia catalog, and sends it back via the existing
look-share link flow. Mock everything below the UI layer — no real OAuth,
no real Gmail parsing. Keep the visual/UX language identical to the already-
built stylist app (Phia tokens, Instrument Serif + Inter, cream/orange/sage).

Scope decisions locked with user:
- In-app chat UI between client ↔ stylist (not Telegram/WhatsApp).
- Stylist and client are separate browser windows (no in-app persona switch).
- Quick actions in chat pared down to ✨ "Dress me for my next event" only.
- `ClosetGarment` is a distinct type from catalog `Garment`.
- Cross-window real-time via the `storage` event (same-origin assumption).
- Demo works with and without Azure Foundry env vars (AI brief has a mock
  fallback).

## Non-goals

- Real OAuth to Gmail / Google Calendar / Outlook.
- Real email parsing for the smart closet.
- Multi-stylist, authentication, push notifications, WebSockets.
- SMS / iMessage / Telegram / WhatsApp channels.
- AI drafts replies autonomously — the AI produces *briefs*; stylist types.
- Any change to the existing try-on chain, Look Builder, or result page flows.

---

## 1. System architecture

**Two personas, one Next.js codebase.**

| Persona | Entry | Stores |
|---|---|---|
| Client (Phoebe) | `/client/sarah` | Reads shared chat store + her own mock fixtures |
| Stylist (Jess) | `/dashboard` → `/clients/sarah` | Reads the same chat store + the same mock fixtures |

### Chat bridge

One Zustand store, `useChatStore`, persisted to `localStorage` key
`phia-chat-v1`. Cross-window sync via a `storage` event listener mounted at
the app root that rehydrates the store when another window writes. Same
origin only — fine for the demo setup.

### Mock data

Static JSON under `src/frontend/lib/mock/`, loaded on the client. Phoebe
(`sarah`) is the rich demo subject; Sophia (`maya`) has thin versions so her
client card isn't empty.

### AI glue

Stylist's `✨ AI brief` button → `POST /api/agent/message` with the exact
trigger phrase the endpoint expects. On 503 ("Missing Foundry configuration")
or any unset-env failure, frontend silently swaps in a hand-written fallback
JSON so the overlay still renders and the click-to-builder deep-links still
work. Judge sees a small "Demo mode" chip when the mock fallback is active.

---

## 2. Customer app surfaces

### Routes

| Route | Purpose |
|---|---|
| `/client/[id]` | Home dashboard — connected-services row, next event, recent messages, closet preview, latest shared look |
| `/client/[id]/chat` | Full chat thread with stylist + composer |
| `/client/[id]/closet` | Grid of Gmail-derived garments with source badges |
| `/client/[id]/inbox` | Grid of stylist-shared looks → existing `/looks/[id]/view` |
| `/client/[id]/settings` | Connected integrations + preferences |

### Home dashboard (anchor)

```
┌──────────────────────────────────────────────────────────────┐
│ phia  [Home] [Chat²] [Closet] [Inbox] [⚙]       Phoebe ▾     │
├──────────────────────────────────────────────────────────────┤
│ Good evening, Phoebe.                                         │
│ Here's what's coming up.                                      │
│                                                               │
│ ┌─────────────┐┌─────────────┐┌─────────────┐                │
│ │ Gmail   ●   ││ Calendar ●  ││ Outlook ●   │                │
│ │ 23 orders   ││ 4 events    ││ 2 events    │                │
│ │ synced 2m   ││ synced 2m   ││ synced 2m   │                │
│ └─────────────┘└─────────────┘└─────────────┘                │
│                                                               │
│  SAT · 4 days                     LATEST MESSAGE · Jess       │
│ ┌────────────────────────┐       ┌──────────────────────────┐│
│ │ Rooftop engagement     │       │ "Saw the wedding — I     ││
│ │ party, DUMBO           │       │  pulled a look that…"     ││
│ │ 7:30 PM · cocktail     │       │ [ Open chat → ]           ││
│ │ [ Ask Jess for a look ]│       │                           ││
│ └────────────────────────┘       └──────────────────────────┘│
│                                                               │
│ YOUR CLOSET · via Gmail                           [see all →]│
│ ┌──┐┌──┐┌──┐┌──┐┌──┐┌──┐                                    │
│ └──┘└──┘└──┘└──┘└──┘└──┘                                    │
│ RECENT LOOKS FROM JESS                            [see all →]│
│ ┌──────────┐┌──────────┐                                     │
│ └──────────┘└──────────┘                                     │
└──────────────────────────────────────────────────────────────┘
```

### Chat page

- Sage-soft (`--sage-soft`) bubbles right-aligned for the client; card-white
  left-aligned for Jess with her avatar + name.
- Inline `<LookShareCard />` for `kind === 'look-share'` messages — cover
  image + occasion + "Open look →" that opens the existing result view.
- Composer with one quick action: `✨ Dress me for my next event` (prefills
  the trigger phrase).

### Closet page

- Grid in the same 3/4 aspect as the existing catalog tiles.
- Card content: image, brand + name, "Purchased <date> · via <retailer>",
  Gmail badge in the corner.
- Filters: category chips + brand dropdown + purchased-within toggle.
- Tap card → expanded panel with source email subject + order total (mock).

### Inbox page

- Grid of `SharedLookCard` tiles pointing at `/looks/[id]/view`.
- Each tile: cover, occasion, sent date, unopened dot.

### Settings page

- Stacked `<IntegrationRow />` items for Gmail / Google Calendar / Outlook
  (connected dot, account email, metrics, last-sync, Disconnect button that
  flips a local Zustand flag).
- Preferences block below: brands, sizes, budget, aesthetic, resale-first.

---

## 3. Stylist dashboard enhancements

### Enhanced `/clients/[id]` — split-column layout

```
┌────────────── LEFT 60% ─────────────┐  ┌──── RIGHT rail 40% ─────┐
│ [photo] Phoebe Gates                 │  │ ─── Chat with Phoebe ──│
│         Sizing · XS · 24 · 7         │  │  [thread + composer]   │
│         [ New look → ]               │  │  [✨ AI brief] [Compose]│
│                                      │  │                         │
│ Notes (existing)                     │  │ ─── Upcoming ───────   │
│                                      │  │  Rooftop engage · SAT  │
│ ── Looks (existing grid) ──          │  │  Editorial shoot · MON │
│                                      │  │  Weekend Hudson · FRI  │
│ ── Closet · via Gmail ──             │  │                         │
│ [clickable tile grid]                │  │ ─── Connected ───────  │
│                                      │  │  Gmail ● Cal ● Outlook●│
│ ── Preferences ──                    │  │                         │
│                                      │  │                         │
└──────────────────────────────────────┘  └─────────────────────────┘
```

- Closet tile click → `/clients/[id]/new-look?seed=<garmentIds>`.
- Upcoming event click → `/clients/[id]/new-look?seed=<ids>&occasion=<title>`.
- `✨ AI brief` → `<AIBriefOverlay />` slide-in with the agent response;
  per-event "Open in Look Builder" buttons deep-link to the seeded builder.

### `/inbox` becomes real

Latest-message-per-thread list derived from `useChatStore`. Click row →
`/clients/[id]#chat` (hash scrolls to / focuses the chat rail).

### Share-back integration (one line)

In `ShareModal`'s confirm handler, post a `kind: 'look-share'` message to
`useChatStore`. That single side-effect wires the entire share flow to
both chats (stylist right-rail + client chat page) via the storage event.

---

## 4. Chat bridge, mock data, AI hookup

### Store shape

```ts
// src/frontend/lib/chatStore.ts
export type ChatMessage = {
  id: string;
  threadId: string;                // `${clientId}-${stylistHandle}`
  sender: 'client' | 'stylist';
  kind: 'text' | 'look-share' | 'system';
  body: string;
  lookId?: string;                 // when kind === 'look-share'
  createdAt: string;               // ISO
};

type ChatState = {
  messagesByThread: Record<string, ChatMessage[]>;
  postMessage: (msg: Omit<ChatMessage, 'id' | 'createdAt'>) => void;
  getThread: (threadId: string) => ChatMessage[];
  clearThread: (threadId: string) => void;
};

export const useChatStore = create<ChatState>()(
  persist(
    (set, get) => ({ /* … */ }),
    { name: 'phia-chat-v1' }
  )
);
```

### Cross-window sync

```ts
// src/frontend/lib/chatSync.ts — imported once in app/layout.tsx
if (typeof window !== 'undefined') {
  window.addEventListener('storage', (e) => {
    if (e.key === 'phia-chat-v1') useChatStore.persist.rehydrate();
  });
}
```

Bootstrap empty threads from `seed-chat.json` so the demo starts with a
short intro exchange, not a blank screen.

### Mock files

All under `src/frontend/lib/mock/`:

| File | Shape | Volume |
|---|---|---|
| `types.ts` | shared TS types (ClosetGarment, CalendarEvent, ParsedOrderEmail, ClientPreferences) | — |
| `client-phoebe-gmail.json` | `{emails, garments}` | 14 orders → 12 garments |
| `client-phoebe-calendar.json` | `{events}` (agent-compatible shape) | 4 events |
| `client-phoebe-outlook.json` | `{events}` | 2 events |
| `client-phoebe-preferences.json` | preferences object | 1 |
| `client-sophia-*.json` | same shapes, skinnier | 3 / 2 / 1 |
| `seed-chat.json` | `ChatMessage[]` keyed by threadId | ~4 per thread |
| `ai-brief-phoebe.json` | mocked agent response | 1 |

### `ClosetGarment` vs catalog `Garment`

Separate types by design:

```ts
type ClosetGarment = {
  id: string;
  name: string;
  brand: string;
  category: 'top' | 'bottom' | 'one-piece' | 'outerwear' | 'shoes' | 'accessory';
  imageUrl: string;
  purchasedAt: string;
  retailPriceAtPurchase: number;
  source: 'gmail';
  sourceEmailSubject: string;
  sourceRetailer: string;
};
```

Shared display primitives (`ClosetItemCard`) accept either with a thin
adapter — different semantics (owned vs. catalog), same visual form.

### AI brief — three-path handling

```ts
const res = await fetch(`${BACKEND_BASE_URL}/api/agent/message`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    message: 'Dress me for my upcoming events.',
    source: 'google_calendar',
    person_image_uri: `${window.location.origin}/clients/phoebe.png`,
    person_image_metadata: { client_id: clientId },
  }),
});
```

1. **200** → render real agent response (reply + events + products_by_event).
2. **503 missing-config** → load `ai-brief-phoebe.json`, show `Demo mode` chip.
3. **Other errors** → inline toast, overlay stays closed.

Mock fallback mirrors the real response shape so `<AIBriefOverlay />` is
write-once. Per-event click → seeded Look Builder.

### Look Builder seeding (4 added lines)

```ts
// new-look/page.tsx
const search = useSearchParams();
const seedIds = search.get('seed')?.split(',').filter(Boolean) ?? [];
const seedOcc = search.get('occasion') ?? '';
const [boardIds, setBoardIds] = useState<string[]>(
  seedIds.length ? seedIds : ['g16', 'g3', 'g13']
);
const [occasion, setOccasion] = useState(seedOcc || 'Rooftop engagement party');
```

### Persistence / reset

- Keys: `phia-chat-v1`, `phia-connected-v1`, `phia-ui-v1`.
- `/client/[id]?reset=1` clears those keys and reloads with fresh seed data
  between demo rehearsals.

---

## 5. Demo script (90 seconds)

Two browser windows side-by-side. **L** = `/client/sarah` · **R** = `/dashboard`.

| T | Action | Visible outcome |
|---|---|---|
| 0:00 | Open both | L: home with connected services, next event, closet, looks. R: dashboard w/ inbox 0 new. |
| 0:10 | L: click Closet → scroll | 12 Gmail-parsed garments, source badges. |
| 0:20 | L: open chat, tap ✨, extend with "…rooftop wedding Saturday", send | Message appears in Phoebe's thread; R inbox badge → (1 new) via `storage` event. |
| 0:30 | R: click inbox row → Phoebe's client detail | Split layout; right rail highlights the new chat message. |
| 0:40 | R: click ✨ AI brief | Slide-in overlay with 3 per-event outfit picks (Demo-mode chip if Azure envs unset). |
| 0:55 | R: click Saturday event | Jumps to `/clients/sarah/new-look?seed=g16,g3,g13&occasion=Rooftop+engagement+party`. |
| 1:05 | R: click Generate try-on | Existing chain overlay runs. |
| 1:20 | R: click Share with Phoebe → confirm | `ShareModal` posts `look-share` message to the thread. |
| 1:25 | Pan to L | Chat shows fresh look-share card. |
| 1:30 | L: click card | Opens existing `/looks/.../view`. End. |

---

## 6. Files to touch

```
src/frontend/
  lib/
    chatStore.ts                 NEW
    chatSync.ts                  NEW
    mock/
      types.ts                              NEW
      client-phoebe-gmail.json              NEW
      client-phoebe-calendar.json           NEW
      client-phoebe-outlook.json            NEW
      client-phoebe-preferences.json        NEW
      client-sophia-gmail.json              NEW
      client-sophia-calendar.json           NEW
      client-sophia-outlook.json            NEW
      client-sophia-preferences.json        NEW
      seed-chat.json                        NEW
      ai-brief-phoebe.json                  NEW
    mock.ts                      UNCHANGED

  components/
    chat/
      ChatThread.tsx             NEW
      ChatComposer.tsx           NEW
      LookShareCard.tsx          NEW
      ChatRail.tsx               NEW (stylist wrapper)
    client/
      ConnectedServicesRow.tsx   NEW
      ClosetItemCard.tsx         NEW
      NextEventCard.tsx          NEW
      UpcomingEventsList.tsx     NEW
      SharedLookCard.tsx         NEW
      IntegrationRow.tsx         NEW
      ClientNavTabs.tsx          NEW
    stylist/
      GmailClosetSection.tsx     NEW
      AIBriefOverlay.tsx         NEW
      StylistInboxRow.tsx        NEW
    result/
      ShareModal.tsx             EDIT — post look-share chat message on confirm

  app/
    layout.tsx                   EDIT — import chatSync side-effect
    client/[id]/page.tsx         NEW
    client/[id]/chat/page.tsx    NEW
    client/[id]/closet/page.tsx  NEW
    client/[id]/inbox/page.tsx   NEW
    client/[id]/settings/page.tsx NEW
    clients/[id]/page.tsx        EDIT — split-column layout; add Closet, Preferences, Upcoming, Connected, Chat rail
    clients/[id]/new-look/page.tsx EDIT — read ?seed and ?occasion
    inbox/page.tsx               EDIT — derive from useChatStore
```

## 7. Verification

1. **Unit-ish**: manually test `useChatStore.postMessage` across two browser
   tabs — second tab re-renders within ~100ms of the first's write. No
   library added other than Zustand persist (already a dep).
2. **Two-window demo walkthrough** against the script in §5, once with
   Azure Foundry envs unset (fallback path) and once with them set
   (real agent). Both should complete without 4xx/5xx in DevTools.
3. **Look share round-trip**: from L → stylist types → stylist builds look
   → shares → L chat card appears → L click opens correct `/looks/[id]/view`
   with the generated try-on image (when `FAL_KEY` is set; otherwise the
   existing cached image path handles it).
4. **Reset hygiene**: `/client/sarah?reset=1` clears all three localStorage
   keys and reloads fresh seed state; can be re-demoed back-to-back.
5. **Typecheck / build**: `npm run build` clean; no new routes fail static
   generation. `PYTHONPATH=src python -m pytest tests/` unchanged (no
   backend modifications).

## 8. Deferred / explicit out-of-scope

- Multi-client chat on the stylist side (only Phoebe is richly wired; Sophia
  has skeleton data so her card isn't empty).
- Real-time typing indicators, read receipts — not in this pass.
- Authentication / sessions — everything is keyed by URL `[id]`.
- Agent that drafts messages on the stylist's behalf — the agent only
  produces briefs; the stylist types their own replies.
- Any modifications to the try-on chain, `/api/tryon`, or `ShareModal`'s UX
  beyond the one-line chat post on confirm.

## 9. Post-approval workflow

After plan approval:
1. Copy this spec to `docs/superpowers/specs/2026-04-18-two-sided-client-stylist-app-design.md` and commit (standard brainstorming output path).
2. Invoke `superpowers:writing-plans` to produce an implementation plan that
   breaks this into independently-executable chunks (e.g. store+mocks →
   customer pages → stylist enhancements → ShareModal wiring → AI brief
   overlay → /inbox wiring), each a bite-sized task for a subagent.
