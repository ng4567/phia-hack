# Design: Layered Multi-Garment Try-On Chain

## Context

FASHN `tryon/v1.6` (via fal.ai) accepts only one garment per call. The current app picks a single board item and sends it, which means stylists can't preview a full outfit (e.g. dress + jacket) on Phoebe even though the board already captures the full look. This spec introduces a sequential chain: each call's output becomes the next call's `model_image`, so 2–3 layered pieces can be tried on in one generate action. Driven by user answers during brainstorming on 2026-04-18.

## Goals

- Layered full-outfit preview, chaining 1–3 FASHN calls per generation.
- Step-by-step UI reveal — stylist sees real progress and intermediate images.
- Partial success on errors: keep the last good intermediate, let the stylist retry.
- Per-step caching: swapping only the outer layer reuses cached base-layer result.

## Non-Goals

- Shoes / accessories on the person (FASHN doesn't support them).
- Parallel variants (same person × N garments shown side-by-side).
- Stylist-controlled chain ordering; ordering is deterministic by category.
- Backend streaming (SSE/WebSocket) — frontend orchestrates sequentially.

## Chain selection & ordering

```
inputs = sorted_selection(board_items)

1. If any one-piece exists → base = most-recently-added one-piece;
   ignore all tops & bottoms (one-piece wins).
2. Else → base = most-recent bottom (if any); then most-recent top (if any).
3. Then → most-recent outerwear (if any).
4. Always drop: shoes, accessories.

Final chain order: [base, top?, outerwear?]   (1–3 steps)
Safety cap: max 3 supported items.
```

`category="auto"` and `mode="balanced"` remain the defaults on every step.
FASHN auto-detects one-piece vs top vs outerwear from the garment image.

## Backend API — additive change

Keep `POST /api/tryon`. Accept **either** `person` file OR `person_url` (exactly one):

```python
@app.post("/api/tryon")
async def api_tryon(
    clothes: UploadFile = File(...),
    person: UploadFile | None = File(None),
    person_url: str | None = Form(None),
):
    if (person is None) == (person_url is None):
        raise HTTPException(400, "Provide exactly one of person or person_url")
    # ... write clothes to tmp as today
    # if person_url: fetch bytes via httpx, write to tmp with same naming scheme
    # else: write person bytes as today
    # call virtual_tryon_cached(person_path, clothes_path) unchanged
    # return {"outputs": [...], "cached": bool}
```

Response shape unchanged. Cache unchanged: `_file_sha256(person_path)` works
identically on uploaded bytes and on downloaded bytes.

Step 1 uses `person` (file upload). Step 2+ uses `person_url = outputs[0]` from
the prior response — no re-upload round trip through the browser.

## Frontend orchestration

`src/frontend/app/clients/[id]/new-look/page.tsx`:

```ts
type StepResult = {
  garment: Garment;
  status: 'ok' | 'failed' | 'skipped';
  imageUrl?: string;
  error?: string;
};

async function buildChain(boardGarments: Garment[]): Garment[] {
  const onePieces = boardGarments.filter(g => g.category === 'one-piece');
  const base = onePieces.length
    ? [onePieces.at(-1)!]
    : [
        boardGarments.filter(g => g.category === 'bottom').at(-1),
        boardGarments.filter(g => g.category === 'top').at(-1),
      ].filter(Boolean) as Garment[];
  const outer = boardGarments.filter(g => g.category === 'outerwear').at(-1);
  return outer ? [...base, outer] : base;
}

async function runChain(person: File, garments: Garment[]): Promise<StepResult[]> {
  const results: StepResult[] = [];
  let personFile: File | undefined = person;
  let personUrl: string | undefined;

  for (let i = 0; i < garments.length; i++) {
    const g = garments[i];
    setActiveStep(i);
    try {
      const body = new FormData();
      body.append('clothes', await toUploadFile(g.imageUrl, `${g.id}.jpg`));
      if (personFile) body.append('person', personFile);
      else body.append('person_url', personUrl!);

      const res = await fetch(`${BACKEND}/api/tryon`, { method: 'POST', body });
      if (!res.ok) throw new Error((await res.json()).detail ?? 'try-on failed');
      const { outputs } = await res.json();
      const nextUrl = outputs[0];

      results.push({ garment: g, status: 'ok', imageUrl: nextUrl });
      personUrl = nextUrl;
      personFile = undefined;
    } catch (err) {
      results.push({ garment: g, status: 'failed', error: String(err) });
      for (let j = i + 1; j < garments.length; j++) {
        results.push({ garment: garments[j], status: 'skipped' });
      }
      break;
    }
  }
  return results;
}
```

Final display uses the last `status === 'ok'` `imageUrl`. If zero steps succeed,
show an error and stay on the builder. Otherwise navigate to the look page,
passing chain summary via URL params (extending the existing `?tryOnImageUrl=`
pattern):

```
/looks/{lookId}?tryOnImageUrl=<final-url>
               &chainIds=<g1,g7,g13>       # ordered garment IDs in the chain
               &failedId=<g7>              # optional; first garment that failed
```

Retry on the result page is just `router.push('/clients/{clientId}/new-look')`.
Board state resets to its hardcoded default, but the per-step cache means
anything that already succeeded in a prior attempt hits cache instantly — only
the failed step and anything after it actually re-runs. Good enough for the
hack-demo scope.

## Progress UI

Replace `GenerateOverlay.tsx`'s fake 4-step loader with chain-driven state:

```
┌─────────────────────────────────────┐
│   [current intermediate image,      │
│    shimmer overlay]                 │
│                                     │
│   02 / 03 · Fitting the jacket…     │
│   Usually ~12s per piece.           │
│                                     │
│   ●──●──○                           │
│   Dress  Jacket  (skipped)          │
└─────────────────────────────────────┘
```

- Copy is generated from `garments[activeStep].name`, not hardcoded strings.
- After each step completes, crossfade the intermediate image (250ms) before
  advancing to the next step.
- On the final successful step, transition to `/looks/…` as today.

## Error & retry

- **Partial success**: last successful intermediate is the result; inline banner
  on result page: *"Couldn't add the {garment.name} — retry, or share as-is."*
- **Retry** button on the banner: `router.push('/clients/{clientId}/new-look')`.
  The builder renders with its default board; stylist clicks Generate again;
  previously successful steps hit the per-step cache (instant), only the failed
  step and any after it actually re-run.
- **Hard failure on step 1**: error toast, stay on builder, no navigation.

## Caching

No cache code changes. Per-step SHA256 key already handles this: step 2's
`person_hash` is the hash of step 1's downloaded output bytes, so swapping only
the outer layer produces a cache hit on step 1 and a miss only on step 2.

## Files to touch

| File | Change |
|---|---|
| `src/app/main.py` | Add `person_url` form field; fetch URL server-side when provided. |
| `src/frontend/app/clients/[id]/new-look/page.tsx` | Replace `handleGenerate` with `buildChain` + `runChain`; drive step state. |
| `src/frontend/components/builder/GenerateOverlay.tsx` | Accept `steps: StepResult[]` + `activeStep`; real copy from garment names; intermediate image crossfade. |
| `src/frontend/app/looks/[id]/page.tsx` | Parse `chainIds` + `failedId` from URL params; render partial-success banner + retry button (routes back to `/clients/{id}/new-look`). |
| `tests/test_tryon_cache.py` | Add case: step 2 using `person_url` of step 1's output hits cache on repeat. |

## Verification

1. **Unit**: `pytest tests/` — existing cache test still passes; new chain cache test passes.
2. **Backend**: `curl -F clothes=@dress.jpg -F person=@phoebe.png http://127.0.0.1:8000/api/tryon` → one output URL. Then `curl -F clothes=@jacket.jpg -F person_url=<that URL> …` → second output.
3. **Frontend golden path**: Phoebe board = [Aiko dress (one-piece), Leather jacket (outerwear)]. Click Generate. Verify overlay shows "01 / 02 · Fitting the dress…" then "02 / 02 · Adding the jacket…", and result image shows both layers.
4. **Partial success**: manually kill backend after step 1 completes. Result page should show the dress-only image with retry banner.
5. **Cache**: Re-run step 3 — overlay transitions near-instantly on step 1 (cached), takes full time on step 2 if garment differs.
6. **One-piece conflict**: Board = [dress, top, bottom]. Verify only the dress is sent; top and bottom are silently skipped in the chain (still shown in the look summary).

## Open questions

None — all design decisions pinned during brainstorming.
