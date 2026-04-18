# phia-hack backend

FASHN virtual try-on via fal.ai. Reads `FAL_KEY` from the repo-root `.env`.

## Setup

```bash
cd backend
npm install
```

## Test the FASHN / fal.ai integration

```bash
npm run test:tryon
```

Exercises both call patterns against fal's public sample images:

- `fal.subscribe("fal-ai/fashn/tryon/v1.6", ...)` — await-to-finish. Used for overnight pre-caching of demo try-ons.
- `fal.queue.submit` + `fal.queue.status` + `fal.queue.result` — matches the frontend's `{ jobId }` + poll contract from `context.md`.

Expected output: two `https://cdn.fashn.ai/...` URLs (one per path), each ~5–17s wall time, $0.075/generation.

## Typecheck

```bash
npm run typecheck
```

## Module map

- `src/env.ts` — loads `FAL_KEY` from `../.env`, fails fast if missing.
- `src/types.ts` — `TryOnInput`, `TryOnResult`, `JobStatus`.
- `src/fashn.ts` — `runTryOn`, `submitTryOn`, `getTryOnStatus`, `getTryOnResult`.
- `scripts/test-tryon.ts` — end-to-end harness.
