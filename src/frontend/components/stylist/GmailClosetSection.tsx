'use client';

// GmailClosetSection — stylist-side grid of the client's Gmail-derived
// closet. Reuses the visual DNA of the builder catalog (ci-img, micro
// brand label, bold item name) but adds a category filter row and a
// small Gmail source badge on each tile.
//
// Click behavior: sends the stylist straight into the Look Builder
// pre-seeded with that garment id as the starting board piece —
// `/clients/[id]/new-look?seed=<garmentId>`. The seed ids used here
// are the Gmail ClosetGarment ids (cg-ph-*, cg-so-*); the builder is
// allowed to ignore ids it doesn't know about (the catalog filters
// `getGarment` by id and silently drops misses), which means a Gmail
// click deep-links to an empty board + the occasion is left blank.
// That's the intended handoff for "start from something she owns" —
// the stylist then builds around it.
//
// Data source: static JSON per client, same pattern as PreferencesPanel.

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';

import phoebeGmail from '@/lib/mock/client-phoebe-gmail.json';
import sophiaGmail from '@/lib/mock/client-sophia-gmail.json';
import type { ClosetGarment, ClosetCategory } from '@/lib/mock/types';
import { cx, fmt } from '@/lib/utils';

interface ClientGmailPayload {
  garments: ClosetGarment[];
}

const GMAIL_BY_CLIENT: Record<string, ClientGmailPayload> = {
  sarah: phoebeGmail as ClientGmailPayload,
  maya: sophiaGmail as ClientGmailPayload,
};

const CATEGORY_ORDER: Array<ClosetCategory | 'all'> = [
  'all',
  'one-piece',
  'top',
  'bottom',
  'outerwear',
  'shoes',
  'accessory',
];

function formatPurchasedAt(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  } catch {
    return iso;
  }
}

function categoryLabel(c: ClosetCategory | 'all'): string {
  if (c === 'all') return 'All';
  if (c === 'one-piece') return 'One-piece';
  return c.charAt(0).toUpperCase() + c.slice(1);
}

export interface GmailClosetSectionProps {
  clientId: string;
}

export function GmailClosetSection({ clientId }: GmailClosetSectionProps) {
  const router = useRouter();
  const [category, setCategory] = useState<ClosetCategory | 'all'>('all');

  const garments = GMAIL_BY_CLIENT[clientId]?.garments ?? EMPTY_GARMENTS;

  const visible = useMemo(() => {
    if (category === 'all') return garments;
    return garments.filter((g) => g.category === category);
  }, [category, garments]);

  const totalRetail = useMemo(
    () => garments.reduce((sum, g) => sum + g.retailPriceAtPurchase, 0),
    [garments],
  );

  const handleOpen = (garmentId: string) => {
    router.push(`/clients/${clientId}/new-look?seed=${encodeURIComponent(garmentId)}`);
  };

  const isEmpty = garments.length === 0;
  const visibleEmpty = visible.length === 0 && !isEmpty;

  return (
    <section className="gcs-root">
      <header className="gcs-head">
        <div className="gcs-head-left">
          <div className="micro">Closet · via Gmail</div>
          <h3 className="serif-italic gcs-title">Pieces she owns</h3>
        </div>
        <div className="gcs-head-right">
          <span className="gcs-meta">
            {garments.length} {garments.length === 1 ? 'piece' : 'pieces'}
          </span>
          <span className="gcs-meta-sep" aria-hidden="true" />
          <span className="gcs-meta">{fmt(totalRetail)} retail tracked</span>
        </div>
      </header>

      {isEmpty ? (
        <div className="gcs-empty">
          <div className="serif-italic gcs-empty-title">
            Gmail hasn&rsquo;t surfaced anything for this client yet.
          </div>
          <p className="gcs-empty-body">
            Once receipts sync, purchased pieces will land here as a starting
            point for new looks.
          </p>
        </div>
      ) : (
        <>
          <div className="gcs-filters" role="tablist" aria-label="Closet category filter">
            {CATEGORY_ORDER.map((c) => (
              <button
                key={c}
                role="tab"
                aria-selected={category === c}
                className={cx('pill gcs-filter', category === c && 'active')}
                onClick={() => setCategory(c)}
              >
                {categoryLabel(c)}
              </button>
            ))}
          </div>

          {visibleEmpty ? (
            <div className="gcs-empty gcs-empty-mini">
              <p className="gcs-empty-body">
                Nothing in {categoryLabel(category).toLowerCase()} yet.
              </p>
            </div>
          ) : (
            <div className="gcs-grid">
              {visible.map((g) => (
                <button
                  key={g.id}
                  type="button"
                  className="gcs-card"
                  onClick={() => handleOpen(g.id)}
                  aria-label={`Start new look with ${g.brand} ${g.name}`}
                >
                  <div
                    className="gcs-img"
                    style={{ backgroundImage: `url(${g.imageUrl})` }}
                  >
                    <span className="gcs-badge" aria-label="From Gmail receipts">
                      <span className="gcs-badge-dot" aria-hidden="true" />
                      Gmail
                    </span>
                  </div>
                  <div className="gcs-body">
                    <div className="micro gcs-brand">{g.brand}</div>
                    <div className="gcs-name">{g.name}</div>
                    <div className="gcs-foot">
                      <span className="gcs-date">
                        {formatPurchasedAt(g.purchasedAt)}
                      </span>
                      <span className="gcs-retailer" title={g.sourceEmailSubject}>
                        via {g.sourceRetailer}
                      </span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </>
      )}

      <style jsx>{`
        .gcs-root {
          background: var(--card);
          border-radius: var(--radius-lg);
          padding: 26px 28px 30px;
          box-shadow: var(--shadow-sm);
        }

        .gcs-head {
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
          gap: 16px;
          margin-bottom: 18px;
          flex-wrap: wrap;
        }
        .gcs-title {
          font-size: 34px;
          line-height: 1;
          letter-spacing: -0.015em;
          margin: 6px 0 0;
        }
        .gcs-head-right {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          color: var(--ink-3);
          font-size: 11.5px;
          letter-spacing: 0.04em;
        }
        .gcs-meta-sep {
          width: 3px;
          height: 3px;
          border-radius: 50%;
          background: var(--ink-4);
          display: inline-block;
        }

        .gcs-filters {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
          padding: 14px 0 18px;
          border-top: 1px solid var(--line);
        }
        .gcs-filter { font-size: 11.5px; padding: 5px 12px; }

        .gcs-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 18px;
        }
        @media (max-width: 1280px) {
          .gcs-grid { grid-template-columns: repeat(2, 1fr); }
        }
        @media (max-width: 560px) {
          .gcs-grid { grid-template-columns: 1fr; }
        }

        .gcs-card {
          text-align: left;
          padding: 0;
          border-radius: var(--radius);
          background: transparent;
          transition: transform .2s cubic-bezier(.2,.7,.2,1);
        }
        .gcs-card:hover { transform: translateY(-2px); }
        .gcs-card:active { transform: translateY(0); }
        .gcs-card:focus-visible {
          outline: 2px solid var(--ink-3);
          outline-offset: 4px;
        }

        .gcs-img {
          aspect-ratio: 3/4;
          border-radius: 12px;
          background: var(--bg-sub) center/cover no-repeat;
          position: relative;
          overflow: hidden;
          transition: box-shadow .2s ease;
        }
        .gcs-card:hover .gcs-img {
          box-shadow: var(--shadow-md);
        }

        .gcs-badge {
          position: absolute;
          top: 10px;
          left: 10px;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 4px 9px 4px 8px;
          border-radius: 999px;
          background: rgba(255,255,255,0.92);
          backdrop-filter: blur(6px);
          -webkit-backdrop-filter: blur(6px);
          font-size: 10px;
          font-weight: 500;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          color: var(--ink-2);
          border: 1px solid var(--line);
        }
        .gcs-badge-dot {
          width: 5px;
          height: 5px;
          border-radius: 50%;
          background: #D93025; /* Gmail red — recognizable without the logo */
          box-shadow: 0 0 0 2px rgba(217,48,37,0.16);
        }

        .gcs-body { padding: 10px 2px 0; }
        .gcs-brand { margin: 0; }
        .gcs-name {
          font-size: 13px;
          line-height: 1.3;
          margin-top: 3px;
          color: var(--ink);
        }
        .gcs-foot {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-top: 6px;
          font-size: 11px;
          color: var(--ink-3);
        }
        .gcs-date { font-variant-numeric: tabular-nums; }
        .gcs-retailer {
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          min-width: 0;
        }

        .gcs-empty {
          padding: 40px 20px;
          text-align: center;
          color: var(--ink-3);
          border: 1px dashed var(--line-2);
          border-radius: var(--radius);
        }
        .gcs-empty-mini {
          padding: 22px 18px;
          color: var(--ink-3);
        }
        .gcs-empty-title {
          font-size: 22px;
          color: var(--ink-2);
        }
        .gcs-empty-body {
          margin: 10px auto 0;
          font-size: 13px;
          line-height: 1.55;
          max-width: 40ch;
          color: var(--ink-3);
        }
      `}</style>
    </section>
  );
}

const EMPTY_GARMENTS: ClosetGarment[] = [];
