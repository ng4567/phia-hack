'use client';

// Customer closet — grid of ClosetItemCards from the client's Gmail fixture.
//
// Filters (local state, no URL params):
//   - Category chip row (all · top · bottom · one-piece · outerwear
//     · shoes · accessory)
//   - Brand multiselect (compact dropdown-like panel)
//   - "Purchased in last 90 days" toggle
//
// Empty-state is rendered when filters eliminate every garment so the
// screen never looks broken.

import { useMemo, useState } from 'react';
import { useParams } from 'next/navigation';

import { ClientNavTabs } from '@/components/client/ClientNavTabs';
import { ClosetItemCard } from '@/components/client/ClosetItemCard';
import phoebeGmail from '@/lib/mock/client-phoebe-gmail.json';
import sophiaGmail from '@/lib/mock/client-sophia-gmail.json';
import type { ClosetGarment, ClosetCategory } from '@/lib/mock/types';
import { getClient } from '@/lib/mock';

const GMAIL: Record<string, { garments: ClosetGarment[] }> = {
  sarah: phoebeGmail as { garments: ClosetGarment[] },
  maya: sophiaGmail as { garments: ClosetGarment[] },
};

const CATEGORIES: Array<{ key: 'all' | ClosetCategory; label: string }> = [
  { key: 'all', label: 'All pieces' },
  { key: 'top', label: 'Tops' },
  { key: 'bottom', label: 'Bottoms' },
  { key: 'one-piece', label: 'One-pieces' },
  { key: 'outerwear', label: 'Outerwear' },
  { key: 'shoes', label: 'Shoes' },
  { key: 'accessory', label: 'Accessories' },
];

const NINETY_DAYS_MS = 90 * 86_400_000;

export default function ClientClosetPage() {
  const { id } = useParams<{ id: string }>();
  const client = getClient(id);

  const [category, setCategory] = useState<'all' | ClosetCategory>('all');
  const [brandFilter, setBrandFilter] = useState<string[]>([]);
  const [recentOnly, setRecentOnly] = useState<boolean>(false);
  const [brandOpen, setBrandOpen] = useState<boolean>(false);
  const [detailGarment, setDetailGarment] = useState<ClosetGarment | null>(null);

  const garments = useMemo(() => GMAIL[id]?.garments ?? [], [id]);

  const brands = useMemo(() => {
    const set = new Set<string>();
    garments.forEach((g) => set.add(g.brand));
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [garments]);

  const filtered = useMemo(() => {
    const now = Date.now();
    return garments.filter((g) => {
      if (category !== 'all' && g.category !== category) return false;
      if (brandFilter.length > 0 && !brandFilter.includes(g.brand)) return false;
      if (recentOnly) {
        const purchased = new Date(g.purchasedAt).getTime();
        if (!isFinite(purchased) || now - purchased > NINETY_DAYS_MS) {
          return false;
        }
      }
      return true;
    });
  }, [garments, category, brandFilter, recentOnly]);

  const toggleBrand = (brand: string) => {
    setBrandFilter((prev) =>
      prev.includes(brand) ? prev.filter((b) => b !== brand) : [...prev, brand],
    );
  };

  const clearFilters = () => {
    setCategory('all');
    setBrandFilter([]);
    setRecentOnly(false);
  };

  const activeFilterCount =
    (category !== 'all' ? 1 : 0) +
    brandFilter.length +
    (recentOnly ? 1 : 0);

  if (!client) return null;

  return (
    <>
      <ClientNavTabs clientId={id} />

      <main className="screen closet-page" data-screen-label="Client · Closet">
        <div className="closet-shell">
          {/* Header */}
          <section className="closet-hero">
            <div className="hero-left">
              <div className="micro">Your closet · parsed from Gmail</div>
              <h1 className="serif-italic closet-title">
                Everything you already own.
              </h1>
              <p className="closet-sub">
                {garments.length} piece{garments.length === 1 ? '' : 's'} parsed from
                your Gmail receipts. Jess sees this when building looks — so she
                never suggests something twice.
              </p>
            </div>
            <div className="hero-stats">
              <div className="stat">
                <div className="micro">In closet</div>
                <div className="serif stat-num">{garments.length}</div>
              </div>
              <div className="stat">
                <div className="micro">Brands</div>
                <div className="serif stat-num">{brands.length}</div>
              </div>
              <div className="stat">
                <div className="micro">This quarter</div>
                <div className="serif stat-num">
                  {garments.filter((g) => {
                    const p = new Date(g.purchasedAt).getTime();
                    return isFinite(p) && Date.now() - p <= NINETY_DAYS_MS;
                  }).length}
                </div>
              </div>
            </div>
          </section>

          {/* Filters */}
          <section className="filters">
            <div className="chip-row">
              {CATEGORIES.map((c) => (
                <button
                  key={c.key}
                  className={`chip ${category === c.key ? 'on' : ''}`}
                  onClick={() => setCategory(c.key)}
                  type="button"
                >
                  {c.label}
                </button>
              ))}
            </div>

            <div className="filters-right">
              <div className="brand-wrap">
                <button
                  type="button"
                  className={`brand-btn ${brandFilter.length > 0 ? 'on' : ''}`}
                  onClick={() => setBrandOpen((v) => !v)}
                  aria-expanded={brandOpen}
                >
                  <span>
                    Brands
                    {brandFilter.length > 0 && (
                      <span className="brand-count"> · {brandFilter.length}</span>
                    )}
                  </span>
                  <span className={`caret ${brandOpen ? 'up' : ''}`} aria-hidden="true">
                    ▾
                  </span>
                </button>
                {brandOpen && (
                  <div className="brand-panel">
                    <div className="brand-panel-head">
                      <span className="micro">Filter by brand</span>
                      {brandFilter.length > 0 && (
                        <button
                          type="button"
                          className="brand-clear"
                          onClick={() => setBrandFilter([])}
                        >
                          Clear
                        </button>
                      )}
                    </div>
                    <div className="brand-list">
                      {brands.map((b) => {
                        const on = brandFilter.includes(b);
                        return (
                          <label key={b} className={`brand-row ${on ? 'on' : ''}`}>
                            <input
                              type="checkbox"
                              checked={on}
                              onChange={() => toggleBrand(b)}
                            />
                            <span>{b}</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              <label className={`toggle ${recentOnly ? 'on' : ''}`}>
                <input
                  type="checkbox"
                  checked={recentOnly}
                  onChange={() => setRecentOnly((v) => !v)}
                />
                <span className="toggle-track">
                  <span className="toggle-thumb" />
                </span>
                <span className="toggle-label">Purchased in the last 90 days</span>
              </label>
            </div>
          </section>

          {/* Grid */}
          {filtered.length > 0 ? (
            <section className="grid stagger">
              {filtered.map((g) => (
                <ClosetItemCard
                  key={g.id}
                  garment={g}
                  onClick={() => setDetailGarment(g)}
                />
              ))}
            </section>
          ) : (
            <section className="closet-empty">
              <div className="serif-italic empty-title">
                No pieces match those filters.
              </div>
              <p className="empty-body">
                {activeFilterCount > 0
                  ? 'Try clearing a filter or widening your brand selection.'
                  : 'Nothing parsed from Gmail yet. Reconnect from Settings to populate your closet.'}
              </p>
              {activeFilterCount > 0 && (
                <button type="button" className="empty-cta" onClick={clearFilters}>
                  Clear filters
                </button>
              )}
            </section>
          )}
        </div>

        {detailGarment && (
          <GarmentDetailOverlay
            garment={detailGarment}
            onClose={() => setDetailGarment(null)}
          />
        )}

        <style jsx>{`
          .closet-page {
            min-height: calc(100vh - 60px);
            padding-bottom: 80px;
          }
          .closet-shell {
            max-width: 1200px;
            margin: 0 auto;
            padding: 32px 32px 0;
            display: flex;
            flex-direction: column;
            gap: 32px;
          }

          .closet-hero {
            display: grid;
            grid-template-columns: 1fr auto;
            gap: 32px;
            align-items: flex-end;
          }
          .hero-left {
            display: flex;
            flex-direction: column;
            gap: 10px;
          }
          .closet-title {
            font-size: 48px;
            line-height: 1.05;
            letter-spacing: -0.02em;
            margin: 4px 0 0;
            color: var(--ink);
          }
          .closet-sub {
            font-size: 14px;
            color: var(--ink-3);
            max-width: 540px;
            line-height: 1.55;
            margin: 0;
          }

          .hero-stats {
            display: flex;
            gap: 2px;
            background: var(--line);
            border-radius: var(--radius-lg);
            overflow: hidden;
            border: 1px solid var(--line);
          }
          .stat {
            background: var(--card);
            padding: 16px 28px;
            min-width: 120px;
            display: flex;
            flex-direction: column;
            gap: 4px;
          }
          .stat-num {
            font-size: 28px;
            line-height: 1;
            letter-spacing: -0.01em;
            color: var(--ink);
          }

          .filters {
            display: flex;
            flex-direction: column;
            gap: 14px;
            padding-bottom: 4px;
          }
          .chip-row {
            display: flex;
            flex-wrap: wrap;
            gap: 7px;
          }
          .chip {
            padding: 7px 14px;
            border-radius: 999px;
            background: var(--card);
            border: 1px solid var(--line);
            font-size: 12.5px;
            color: var(--ink-2);
            cursor: pointer;
            transition:
              background 0.2s ease,
              color 0.2s ease,
              border-color 0.2s ease;
          }
          .chip:hover {
            background: var(--bg);
          }
          .chip.on {
            background: var(--ink);
            color: var(--card);
            border-color: var(--ink);
          }

          .filters-right {
            display: flex;
            align-items: center;
            gap: 14px;
            flex-wrap: wrap;
          }
          .brand-wrap {
            position: relative;
          }
          .brand-btn {
            display: inline-flex;
            align-items: center;
            gap: 8px;
            padding: 8px 14px;
            border-radius: 999px;
            background: var(--card);
            border: 1px solid var(--line);
            font-size: 12.5px;
            color: var(--ink);
            cursor: pointer;
            transition: all 0.2s ease;
          }
          .brand-btn:hover {
            background: var(--bg);
          }
          .brand-btn.on {
            border-color: var(--accent);
            color: var(--ink);
          }
          .brand-count {
            color: var(--accent);
            font-weight: 500;
          }
          .caret {
            font-size: 10px;
            color: var(--ink-3);
            transition: transform 0.2s ease;
          }
          .caret.up {
            transform: rotate(180deg);
          }

          .brand-panel {
            position: absolute;
            top: calc(100% + 8px);
            left: 0;
            width: 260px;
            max-height: 300px;
            overflow-y: auto;
            background: var(--card);
            border: 1px solid var(--line);
            border-radius: var(--radius);
            box-shadow: var(--shadow-lg);
            z-index: 30;
            padding: 12px 10px;
            animation: fadeUp 0.22s cubic-bezier(0.2, 0.7, 0.2, 1) both;
          }
          .brand-panel-head {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 4px 8px 8px;
            border-bottom: 1px solid var(--line);
            margin-bottom: 6px;
          }
          .brand-clear {
            font-size: 11px;
            letter-spacing: 0.08em;
            text-transform: uppercase;
            color: var(--accent);
            font-weight: 500;
            cursor: pointer;
          }
          .brand-clear:hover {
            color: #C96945;
          }
          .brand-list {
            display: flex;
            flex-direction: column;
          }
          .brand-row {
            display: flex;
            align-items: center;
            gap: 10px;
            padding: 8px;
            border-radius: 6px;
            font-size: 13px;
            color: var(--ink-2);
            cursor: pointer;
            transition: background 0.15s ease;
          }
          .brand-row:hover {
            background: var(--bg);
            color: var(--ink);
          }
          .brand-row.on {
            color: var(--ink);
          }
          .brand-row input {
            width: 15px;
            height: 15px;
            accent-color: var(--accent);
            cursor: pointer;
          }

          .toggle {
            display: inline-flex;
            align-items: center;
            gap: 10px;
            font-size: 12.5px;
            color: var(--ink-2);
            cursor: pointer;
            user-select: none;
          }
          .toggle input {
            position: absolute;
            opacity: 0;
            width: 0;
            height: 0;
          }
          .toggle-track {
            position: relative;
            width: 34px;
            height: 20px;
            border-radius: 999px;
            background: var(--bg-sub);
            border: 1px solid var(--line);
            transition: background 0.2s ease, border-color 0.2s ease;
          }
          .toggle-thumb {
            position: absolute;
            top: 1px;
            left: 1px;
            width: 16px;
            height: 16px;
            border-radius: 50%;
            background: var(--card);
            box-shadow: 0 1px 2px rgba(0, 0, 0, 0.12);
            transition: transform 0.25s cubic-bezier(0.2, 0.7, 0.2, 1);
          }
          .toggle.on .toggle-track {
            background: var(--accent);
            border-color: var(--accent);
          }
          .toggle.on .toggle-thumb {
            transform: translateX(14px);
          }
          .toggle.on .toggle-label {
            color: var(--ink);
          }

          .grid {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 20px 18px;
          }

          .closet-empty {
            padding: 48px 32px;
            background: var(--card);
            border: 1px dashed var(--line-2);
            border-radius: var(--radius-lg);
            display: flex;
            flex-direction: column;
            gap: 10px;
            align-items: flex-start;
          }
          .empty-title {
            font-size: 24px;
            line-height: 1.15;
            color: var(--ink);
          }
          .empty-body {
            font-size: 13px;
            color: var(--ink-3);
            max-width: 420px;
            line-height: 1.5;
            margin: 0;
          }
          .empty-cta {
            margin-top: 8px;
            padding: 10px 18px;
            border-radius: 999px;
            background: var(--ink);
            color: var(--card);
            font-size: 12px;
            font-weight: 500;
            transition: transform 0.2s cubic-bezier(0.2, 0.7, 0.2, 1),
              background 0.2s ease;
          }
          .empty-cta:hover {
            background: #000;
            transform: translateY(-1px);
          }

          @media (max-width: 980px) {
            .grid {
              grid-template-columns: repeat(3, 1fr);
            }
            .closet-hero {
              grid-template-columns: 1fr;
              align-items: flex-start;
            }
            .hero-stats {
              align-self: stretch;
            }
          }
          @media (max-width: 640px) {
            .closet-shell {
              padding: 24px 18px 0;
            }
            .closet-title {
              font-size: 36px;
            }
            .grid {
              grid-template-columns: repeat(2, 1fr);
            }
            .stat {
              flex: 1;
              min-width: 0;
              padding: 14px 16px;
            }
          }

          @keyframes fadeUp {
            from {
              opacity: 0;
              transform: translateY(-6px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
        `}</style>
      </main>
    </>
  );
}

// ───────────────────────────────────────────────────────────────────────────
// Garment detail overlay — simple modal that surfaces the source email
// subject + retailer + order context for a single closet piece. Matches
// the spec's "Tap card → expanded panel" affordance on the closet page.

function GarmentDetailOverlay({
  garment,
  onClose,
}: {
  garment: ClosetGarment;
  onClose: () => void;
}) {
  const purchased = new Date(garment.purchasedAt).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <div
      className="overlay"
      role="dialog"
      aria-modal="true"
      aria-label={`${garment.brand} ${garment.name} — order detail`}
      onClick={onClose}
    >
      <div className="sheet" onClick={(e) => e.stopPropagation()}>
        <button type="button" className="close-btn" onClick={onClose} aria-label="Close">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
            <path d="M6 6l12 12M6 18L18 6" />
          </svg>
        </button>
        <div
          className="sheet-img"
          style={{ backgroundImage: `url(${garment.imageUrl})` }}
          aria-hidden="true"
        />
        <div className="sheet-body">
          <div className="sheet-badge">
            <span className="sheet-dot" />
            Sourced from Gmail
          </div>
          <div className="micro">{garment.brand}</div>
          <h2 className="serif-italic sheet-name">{garment.name}</h2>
          <dl className="sheet-grid">
            <div className="row">
              <dt>Category</dt>
              <dd className="cap">{garment.category.replace('-', ' ')}</dd>
            </div>
            <div className="row">
              <dt>Purchased</dt>
              <dd>{purchased}</dd>
            </div>
            <div className="row">
              <dt>Retailer</dt>
              <dd>{garment.sourceRetailer}</dd>
            </div>
            <div className="row">
              <dt>Order total</dt>
              <dd className="num">${garment.retailPriceAtPurchase.toLocaleString()}</dd>
            </div>
          </dl>
          <div className="source-email">
            <div className="micro">Source email</div>
            <div className="source-subject">{garment.sourceEmailSubject}</div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .overlay {
          position: fixed;
          inset: 0;
          background: rgba(26, 24, 22, 0.42);
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
          z-index: 90;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 32px;
          animation: fadeOverlay 0.25s ease both;
        }
        @keyframes fadeOverlay {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        .sheet {
          position: relative;
          width: 100%;
          max-width: 720px;
          background: var(--card);
          border-radius: var(--radius-xl);
          overflow: hidden;
          box-shadow: var(--shadow-lg);
          display: grid;
          grid-template-columns: minmax(200px, 1fr) 1.2fr;
          min-height: 480px;
          animation: sheetIn 0.35s cubic-bezier(0.2, 0.7, 0.2, 1) both;
        }
        @keyframes sheetIn {
          from {
            opacity: 0;
            transform: translateY(16px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .close-btn {
          position: absolute;
          top: 14px;
          right: 14px;
          width: 30px;
          height: 30px;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.92);
          color: var(--ink);
          display: inline-flex;
          align-items: center;
          justify-content: center;
          z-index: 2;
          box-shadow: var(--shadow-sm);
          transition: transform 0.2s cubic-bezier(0.2, 0.7, 0.2, 1);
        }
        .close-btn:hover {
          transform: scale(1.08);
        }

        .sheet-img {
          background: var(--bg-sub) center/cover no-repeat;
          min-height: 360px;
        }
        .sheet-body {
          padding: 32px 34px 36px;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .sheet-badge {
          align-self: flex-start;
          display: inline-flex;
          align-items: center;
          gap: 7px;
          padding: 5px 11px;
          border-radius: 999px;
          background: var(--bg);
          border: 1px solid var(--line);
          font-size: 10.5px;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: var(--ink-2);
          font-weight: 500;
        }
        .sheet-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #C5221F;
        }
        .sheet-name {
          font-size: 32px;
          line-height: 1.1;
          letter-spacing: -0.01em;
          color: var(--ink);
          margin: 6px 0 12px;
        }

        .sheet-grid {
          display: flex;
          flex-direction: column;
          gap: 0;
          margin: 0;
          padding: 14px 0;
          border-top: 1px solid var(--line);
          border-bottom: 1px solid var(--line);
        }
        .row {
          display: flex;
          justify-content: space-between;
          align-items: baseline;
          padding: 8px 0;
        }
        .row dt {
          font-size: 10.5px;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: var(--ink-3);
          font-weight: 500;
        }
        .row dd {
          margin: 0;
          font-size: 13.5px;
          color: var(--ink);
        }
        .row dd.cap {
          text-transform: capitalize;
        }
        .row dd.num {
          font-variant-numeric: tabular-nums;
          font-family: var(--font-serif), Georgia, serif;
          font-style: italic;
          font-size: 17px;
          letter-spacing: -0.01em;
          color: var(--ink);
        }

        .source-email {
          padding: 14px 16px;
          background: var(--bg);
          border-radius: var(--radius);
          display: flex;
          flex-direction: column;
          gap: 5px;
          margin-top: 4px;
        }
        .source-subject {
          font-size: 13px;
          color: var(--ink);
          font-style: italic;
        }

        @media (max-width: 720px) {
          .sheet {
            grid-template-columns: 1fr;
            max-width: 420px;
            min-height: 0;
          }
          .sheet-img {
            aspect-ratio: 4 / 5;
          }
          .sheet-body {
            padding: 24px 22px 28px;
          }
          .sheet-name {
            font-size: 26px;
          }
        }
      `}</style>
    </div>
  );
}
