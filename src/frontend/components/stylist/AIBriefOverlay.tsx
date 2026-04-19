'use client';

// AIBriefOverlay — slide-in panel that shows the agent's per-event
// outfit brief for the active client. Three paths:
//   1. 200 response  → render reply + events + products_by_event.
//   2. 503 or a "missing Foundry / FAL key" style detail →
//      silently swap in the hand-written fallback JSON
//      (`ai-brief-phoebe.json`) and show a "Demo mode" chip.
//   3. Any other error → inline error state with a retry button
//      inside the overlay (judge still sees something).
//
// The per-event "Open in Look Builder" button deep-links to
// `/clients/[id]/new-look?seed=<ids>&occasion=<title>`. Because the
// products in the fixture (and the real agent) reference catalog ids
// (`g1`, `g13`, etc.), we use them directly; if a product fails the
// catalog lookup, we fall back to name-based matching before giving
// up and dropping the id from the seed list.
//
// The panel itself is a right-rail sheet: 520px on desktop, collapses
// to full width below 720px. Uses a scrim click + Escape to close,
// with body scroll lock while open.

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';

import { MOCK } from '@/lib/mock';
import aiBriefFallback from '@/lib/mock/ai-brief-phoebe.json';
import type {
  AIBriefPayload,
  AIBriefProduct,
  AIBriefProductsByEvent,
  CalendarEvent,
} from '@/lib/mock/types';
import { fmt } from '@/lib/utils';
import { Icon } from '@/components/Icon';

// ─── Backend resolution ───────────────────────────────────────────────────
// Mirrors the `getBackendBaseUrl()` resolver used by `new-look/page.tsx`
// so the AI-brief call and the try-on call always point at the same
// origin. Accepts either an absolute URL or a bare hostname; trims
// trailing slashes.
function getBackendBaseUrl(): string {
  const configured = process.env.NEXT_PUBLIC_TRYON_BACKEND_URL?.trim();
  if (configured) {
    try {
      return new URL(configured).toString().replace(/\/+$/, '');
    } catch {
      return configured.replace(/\/+$/, '');
    }
  }
  if (process.env.NODE_ENV === 'production') {
    // In production the env var must be set — fall back to same-origin so
    // the overlay at least surfaces a real error instead of throwing at
    // module load. The fetch will fail fast and the catch path kicks in.
    return '';
  }
  return 'http://127.0.0.1:8000';
}

const BACKEND_BASE_URL = getBackendBaseUrl();
const FALLBACK_HINTS = [
  'missing foundry',
  'foundry configuration',
  'missing fal',
  'fal key',
  'fal_key',
  'missing azure',
  'azure foundry',
];

type OverlayMode = 'loading' | 'ready' | 'error';

export interface AIBriefOverlayProps {
  open: boolean;
  clientId: string;
  onClose: () => void;
}

// Fuzzy-match an AI product to a catalog garment id.
function resolveGarmentId(p: AIBriefProduct): string | null {
  const fromId = MOCK.garments.find((g) => g.id === p.id);
  if (fromId) return fromId.id;
  const lowerName = p.name.toLowerCase();
  const lowerBrand = p.brand.toLowerCase();
  const byName = MOCK.garments.find(
    (g) =>
      g.name.toLowerCase() === lowerName && g.brand.toLowerCase() === lowerBrand,
  );
  if (byName) return byName.id;
  return null;
}

function buildSeedString(products: AIBriefProduct[]): string {
  const ids: string[] = [];
  for (const p of products) {
    const gid = resolveGarmentId(p);
    if (gid && !ids.includes(gid)) ids.push(gid);
  }
  return ids.join(',');
}

function coerceFallback(): AIBriefPayload {
  return aiBriefFallback as AIBriefPayload;
}

export function AIBriefOverlay({ open, clientId, onClose }: AIBriefOverlayProps) {
  const router = useRouter();

  const [mode, setMode] = useState<OverlayMode>('loading');
  const [payload, setPayload] = useState<AIBriefPayload | null>(null);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [demoMode, setDemoMode] = useState<boolean>(false);
  const fetchIdRef = useRef<number>(0);

  const runFetch = useCallback(async () => {
    const myFetchId = ++fetchIdRef.current;
    setMode('loading');
    setErrorMsg('');
    setPayload(null);
    setDemoMode(false);

    const personImageUri =
      typeof window !== 'undefined'
        ? `${window.location.origin}/clients/phoebe.png`
        : '/clients/phoebe.png';

    try {
      if (!BACKEND_BASE_URL) throw new Error('Backend URL not configured.');

      const res = await fetch(`${BACKEND_BASE_URL}/api/agent/message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: 'Dress me for my upcoming events.',
          source: 'google_calendar',
          person_image_uri: personImageUri,
          person_image_metadata: { client_id: clientId },
        }),
      });

      const bodyText = await res.text();
      let parsed: Partial<AIBriefPayload> & { detail?: string } = {};
      if (bodyText) {
        try {
          parsed = JSON.parse(bodyText);
        } catch {
          parsed = { detail: bodyText };
        }
      }

      // Only commit if this is still the latest fetch.
      if (myFetchId !== fetchIdRef.current) return;

      if (res.status === 200 && parsed && Array.isArray(parsed.events)) {
        setPayload(parsed as AIBriefPayload);
        setMode('ready');
        return;
      }

      const detailLower = (parsed.detail ?? '').toLowerCase();
      const isConfigFail =
        res.status === 503 ||
        FALLBACK_HINTS.some((hint) => detailLower.includes(hint));

      if (isConfigFail) {
        setPayload(coerceFallback());
        setDemoMode(true);
        setMode('ready');
        return;
      }

      throw new Error(parsed.detail || `Agent returned ${res.status}.`);
    } catch (err) {
      if (myFetchId !== fetchIdRef.current) return;
      // Network failure in dev (backend not running) is indistinguishable
      // from a "missing env" response in terms of judge impact — both
      // mean we should still show the brief. Treat as demo mode.
      const message = err instanceof Error ? err.message : String(err);
      const looksLikeNetwork =
        message.toLowerCase().includes('failed to fetch') ||
        message.toLowerCase().includes('network') ||
        message.toLowerCase().includes('backend url');

      if (looksLikeNetwork) {
        setPayload(coerceFallback());
        setDemoMode(true);
        setMode('ready');
      } else {
        setErrorMsg(message);
        setMode('error');
      }
    }
  }, [clientId]);

  // Fetch when the overlay opens. Skipping the effect when closed keeps
  // the network idle when the panel is hidden.
  useEffect(() => {
    if (!open) return;
    void runFetch();
  }, [open, runFetch]);

  // Escape-to-close and body scroll lock when open.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, onClose]);

  // ── event → products map for quick lookup ───────────────────────────────
  const productsByEventId = useMemo(() => {
    const map = new Map<string, AIBriefProductsByEvent>();
    if (payload?.products_by_event) {
      for (const entry of payload.products_by_event) {
        map.set(entry.event_id, entry);
      }
    }
    return map;
  }, [payload]);

  const openInBuilder = useCallback(
    (ev: CalendarEvent) => {
      const bundle = productsByEventId.get(ev.id);
      const seed = bundle ? buildSeedString(bundle.products) : '';
      const seedParam = seed ? `seed=${encodeURIComponent(seed)}&` : '';
      const occParam = `occasion=${encodeURIComponent(ev.title)}`;
      router.push(`/clients/${clientId}/new-look?${seedParam}${occParam}`);
      onClose();
    },
    [clientId, productsByEventId, router, onClose],
  );

  if (!open) return null;

  return (
    <div
      className="aio-scrim"
      role="dialog"
      aria-modal="true"
      aria-label="AI outfit brief"
      onClick={onClose}
    >
      <aside
        className="aio-panel"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="aio-head">
          <div className="aio-head-left">
            <div className="micro aio-eyebrow">
              <Icon.spark />
              <span>AI brief</span>
              {demoMode && <span className="aio-demo">Demo mode</span>}
            </div>
            <h2 className="serif-italic aio-title">
              Dress her for the week ahead
            </h2>
          </div>
          <button
            className="aio-close"
            onClick={onClose}
            aria-label="Close AI brief"
            type="button"
          >
            <Icon.close />
          </button>
        </header>

        <div className="aio-scroll">
          {mode === 'loading' && (
            <div className="aio-loading">
              <div className="aio-skel aio-skel-reply" aria-hidden="true" />
              {[0, 1, 2].map((i) => (
                <div key={i} className="aio-skel-event" aria-hidden="true">
                  <div className="aio-skel aio-skel-h1" />
                  <div className="aio-skel-row">
                    <div className="aio-skel aio-skel-tile" />
                    <div className="aio-skel aio-skel-tile" />
                    <div className="aio-skel aio-skel-tile" />
                  </div>
                </div>
              ))}
              <div className="aio-loading-note">Reading calendar + styling…</div>
            </div>
          )}

          {mode === 'error' && (
            <div className="aio-error">
              <div className="serif-italic aio-error-title">
                Couldn&rsquo;t pull the brief.
              </div>
              <p className="aio-error-body">{errorMsg}</p>
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => void runFetch()}
              >
                Retry
              </button>
            </div>
          )}

          {mode === 'ready' && payload && (
            <div className="aio-body">
              <section className="aio-reply">
                <div className="micro">Stylist notes, from the agent</div>
                <p className="aio-reply-text">{payload.reply}</p>
              </section>

              <div className="aio-divider" aria-hidden="true" />

              <div className="aio-events">
                {payload.events.map((ev) => {
                  const bundle = productsByEventId.get(ev.id);
                  const products = bundle?.products ?? [];
                  const totalRetail = products.reduce(
                    (s, p) => s + (p.retail_price ?? 0),
                    0,
                  );
                  const totalPhia = products.reduce(
                    (s, p) => s + (p.phia_price ?? p.retail_price ?? 0),
                    0,
                  );
                  return (
                    <article key={ev.id} className="aio-event">
                      <header className="aio-event-head">
                        <div>
                          <div className="micro">
                            {ev.source === 'outlook' ? 'Outlook' : 'Google Calendar'} · {ev.category}
                          </div>
                          <h3 className="serif-italic aio-event-title">
                            {ev.title}
                          </h3>
                          <div className="aio-event-meta">
                            <span>{ev.location}</span>
                            <span className="aio-dot" aria-hidden="true" />
                            <span className="aio-code">{ev.dress_code}</span>
                          </div>
                        </div>
                        <div className="aio-totals">
                          <div className="micro">With phia</div>
                          <div className="serif aio-total-phia">
                            {fmt(totalPhia)}
                          </div>
                          {totalRetail > totalPhia && (
                            <div className="strike aio-total-retail">
                              {fmt(totalRetail)}
                            </div>
                          )}
                        </div>
                      </header>

                      {products.length > 0 ? (
                        <div className="aio-products">
                          {products.map((p) => (
                            <div key={p.id} className="aio-product">
                              <div
                                className="aio-product-img"
                                style={{ backgroundImage: `url(${p.image_url})` }}
                              />
                              <div className="aio-product-body">
                                <div className="micro">{p.brand}</div>
                                <div className="aio-product-name">{p.name}</div>
                                <div className="aio-product-prices">
                                  <span className="aio-product-phia">
                                    {fmt(p.phia_price ?? p.retail_price)}
                                  </span>
                                  {p.phia_price !== undefined &&
                                    p.phia_price < p.retail_price && (
                                      <span className="strike aio-product-retail">
                                        {fmt(p.retail_price)}
                                      </span>
                                    )}
                                </div>
                                <p className="aio-product-rationale">
                                  {p.rationale}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="aio-event-empty">
                          No product picks yet for this one.
                        </p>
                      )}

                      <div className="aio-event-foot">
                        <button
                          type="button"
                          className="btn btn-primary aio-open-cta"
                          onClick={() => openInBuilder(ev)}
                        >
                          <Icon.spark /> Open in Look Builder
                        </button>
                      </div>
                    </article>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </aside>

      <style jsx>{`
        .aio-scrim {
          position: fixed;
          inset: 0;
          background: rgba(26,24,22,0.34);
          backdrop-filter: blur(3px);
          -webkit-backdrop-filter: blur(3px);
          z-index: 110;
          animation: aio-fade .2s ease both;
        }
        @keyframes aio-fade { from { opacity: 0; } to { opacity: 1; } }

        .aio-panel {
          position: fixed;
          top: 0;
          right: 0;
          bottom: 0;
          width: min(60%, 680px);
          background: var(--bg);
          box-shadow: -24px 0 60px rgba(26,24,22,0.12);
          display: flex;
          flex-direction: column;
          animation: aio-slide .36s cubic-bezier(.2,.7,.2,1) both;
          z-index: 111;
        }
        @keyframes aio-slide {
          from { transform: translateX(32px); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        @media (max-width: 720px) {
          .aio-panel { width: 100%; }
        }

        .aio-head {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 16px;
          padding: 26px 28px 16px;
          border-bottom: 1px solid var(--line);
          background: rgba(245,244,241,0.85);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
        }
        .aio-eyebrow {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          color: var(--accent);
        }
        .aio-demo {
          margin-left: 4px;
          padding: 3px 8px;
          font-size: 9.5px;
          letter-spacing: 0.12em;
          background: var(--accent-soft);
          color: var(--accent);
          border-radius: 999px;
          border: 1px solid rgba(217,119,87,0.3);
        }
        .aio-title {
          font-size: 38px;
          line-height: 1.02;
          letter-spacing: -0.015em;
          margin: 6px 0 0;
          max-width: 22ch;
        }
        .aio-close {
          width: 34px;
          height: 34px;
          border-radius: 50%;
          background: var(--card);
          border: 1px solid var(--line);
          color: var(--ink-2);
          display: inline-flex;
          align-items: center;
          justify-content: center;
          transition: background .18s ease, color .18s ease;
          flex-shrink: 0;
          margin-top: 4px;
        }
        .aio-close:hover {
          background: var(--ink);
          color: var(--card);
          border-color: var(--ink);
        }

        .aio-scroll {
          flex: 1 1 auto;
          overflow-y: auto;
          padding: 24px 28px 48px;
        }

        .aio-loading { display: flex; flex-direction: column; gap: 22px; }
        .aio-skel {
          background: linear-gradient(90deg, var(--bg-sub) 0%, #E8E6E1 50%, var(--bg-sub) 100%);
          background-size: 200% 100%;
          animation: aio-shimmer 1.4s linear infinite;
          border-radius: 8px;
        }
        @keyframes aio-shimmer {
          0% { background-position: 100% 0; }
          100% { background-position: -100% 0; }
        }
        .aio-skel-reply { height: 96px; border-radius: var(--radius); }
        .aio-skel-event { display: flex; flex-direction: column; gap: 10px; }
        .aio-skel-h1 { height: 22px; width: 60%; }
        .aio-skel-row { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; }
        .aio-skel-tile { aspect-ratio: 3/4; border-radius: 10px; }
        .aio-loading-note {
          font-size: 11.5px;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: var(--ink-3);
          text-align: center;
          margin-top: 8px;
        }

        .aio-error {
          padding: 48px 16px;
          text-align: center;
          background: var(--card);
          border-radius: var(--radius-lg);
          border: 1px solid var(--line);
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 12px;
        }
        .aio-error-title { font-size: 26px; color: var(--ink); }
        .aio-error-body {
          font-size: 13px;
          color: var(--ink-3);
          max-width: 48ch;
          line-height: 1.5;
          margin: 0;
        }

        .aio-reply {
          background: var(--card);
          border: 1px solid var(--line);
          border-radius: var(--radius-lg);
          padding: 20px 22px;
          box-shadow: var(--shadow-sm);
        }
        .aio-reply-text {
          font-size: 14px;
          line-height: 1.65;
          color: var(--ink);
          margin: 10px 0 0;
        }

        .aio-divider {
          height: 1px;
          background: var(--line);
          margin: 28px 0;
        }

        .aio-events { display: flex; flex-direction: column; gap: 28px; }

        .aio-event {
          background: var(--card);
          border-radius: var(--radius-lg);
          padding: 22px 24px 22px;
          box-shadow: var(--shadow-sm);
        }
        .aio-event-head {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 16px;
          padding-bottom: 16px;
          border-bottom: 1px solid var(--line);
        }
        .aio-event-title {
          font-size: 28px;
          line-height: 1.05;
          letter-spacing: -0.01em;
          margin: 6px 0 6px;
        }
        .aio-event-meta {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 11.5px;
          color: var(--ink-3);
        }
        .aio-code { text-transform: capitalize; }
        .aio-dot {
          width: 3px;
          height: 3px;
          border-radius: 50%;
          background: var(--ink-4);
        }

        .aio-totals {
          text-align: right;
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 2px;
        }
        .aio-total-phia {
          font-size: 24px;
          color: var(--accent);
          line-height: 1;
          margin-top: 2px;
        }
        .aio-total-retail { font-size: 12px; }

        .aio-products {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 14px;
          padding: 18px 0 18px;
        }
        @media (max-width: 560px) {
          .aio-products { grid-template-columns: 1fr; }
        }
        .aio-product {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .aio-product-img {
          aspect-ratio: 3/4;
          border-radius: 10px;
          background: var(--bg-sub) center/cover no-repeat;
        }
        .aio-product-body { padding: 0 2px; }
        .aio-product-name {
          font-size: 12.5px;
          line-height: 1.3;
          margin-top: 3px;
          color: var(--ink);
        }
        .aio-product-prices {
          display: flex;
          align-items: baseline;
          gap: 6px;
          margin-top: 5px;
          font-size: 11px;
        }
        .aio-product-phia {
          font-weight: 500;
          color: var(--ink);
        }
        .aio-product-retail { font-size: 10px; }
        .aio-product-rationale {
          margin: 8px 0 0;
          font-size: 11.5px;
          line-height: 1.5;
          color: var(--ink-3);
          font-style: italic;
        }
        .aio-event-empty {
          margin: 18px 0;
          font-size: 12.5px;
          color: var(--ink-3);
          text-align: center;
        }

        .aio-event-foot {
          display: flex;
          justify-content: flex-end;
          padding-top: 6px;
          border-top: 1px solid var(--line);
          margin-top: 4px;
          padding-top: 16px;
        }
        .aio-open-cta { padding: 10px 18px; }
      `}</style>
    </div>
  );
}
