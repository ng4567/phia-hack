'use client';

// ClosetItemCard — 3/4 portrait tile for a ClosetGarment (Gmail-derived).
// Matches the existing catalog `.cat-item` aesthetic in the Look Builder
// but surfaces provenance (Gmail source badge + retailer line). On hover,
// a scrim reveals the source email subject (truncated).

import type { ClosetGarment } from '@/lib/mock/types';

export interface ClosetItemCardProps {
  garment: ClosetGarment;
  onClick?: () => void;
}

function prettyDate(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  } catch {
    return '—';
  }
}

function truncate(text: string, n: number): string {
  if (text.length <= n) return text;
  return `${text.slice(0, n - 1).trimEnd()}…`;
}

export function ClosetItemCard({ garment, onClick }: ClosetItemCardProps) {
  const purchasedLabel = prettyDate(garment.purchasedAt);
  const subjectShort = truncate(garment.sourceEmailSubject, 56);

  return (
    <article
      className="closet-item"
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={
        onClick
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onClick();
              }
            }
          : undefined
      }
    >
      <div
        className="img"
        style={{ backgroundImage: `url(${garment.imageUrl})` }}
        aria-label={`${garment.brand} ${garment.name}`}
      >
        <div className="source-badge" aria-hidden="true">
          <span className="badge-dot" />
          <span>Gmail</span>
        </div>
        <div className="hover-scrim">
          <div className="scrim-micro">Source email</div>
          <div className="scrim-subject">&ldquo;{subjectShort}&rdquo;</div>
        </div>
      </div>
      <div className="meta">
        <div className="brand">{garment.brand}</div>
        <div className="name">{garment.name}</div>
        <div className="provenance">
          Purchased {purchasedLabel} · via {garment.sourceRetailer}
        </div>
      </div>

      <style jsx>{`
        .closet-item {
          display: flex;
          flex-direction: column;
          cursor: ${onClick ? 'pointer' : 'default'};
          transition: transform 0.25s cubic-bezier(0.2, 0.7, 0.2, 1);
        }
        .closet-item:hover {
          transform: translateY(-2px);
        }

        .img {
          position: relative;
          aspect-ratio: 3 / 4;
          width: 100%;
          background: var(--bg-sub) center/cover no-repeat;
          border-radius: 12px;
          overflow: hidden;
        }

        .source-badge {
          position: absolute;
          top: 10px;
          right: 10px;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 4px 9px;
          border-radius: 999px;
          background: rgba(255, 255, 255, 0.92);
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
          font-size: 10px;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: var(--ink-2);
          font-weight: 500;
          box-shadow: 0 1px 2px rgba(26, 24, 22, 0.08);
        }
        .badge-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #C5221F;
        }

        .hover-scrim {
          position: absolute;
          inset: 0;
          padding: 14px;
          display: flex;
          flex-direction: column;
          justify-content: flex-end;
          gap: 4px;
          background: linear-gradient(
            180deg,
            rgba(26, 24, 22, 0) 45%,
            rgba(26, 24, 22, 0.76) 100%
          );
          opacity: 0;
          transition: opacity 0.28s cubic-bezier(0.2, 0.7, 0.2, 1);
        }
        .closet-item:hover .hover-scrim,
        .closet-item:focus-visible .hover-scrim {
          opacity: 1;
        }
        .scrim-micro {
          font-size: 9.5px;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: rgba(255, 255, 255, 0.68);
          font-weight: 500;
        }
        .scrim-subject {
          font-family: var(--font-serif), Georgia, serif;
          font-style: italic;
          font-size: 14px;
          line-height: 1.35;
          color: #fff;
          max-width: 96%;
        }

        .meta {
          padding: 10px 2px 0;
          display: flex;
          flex-direction: column;
          gap: 2px;
        }
        .brand {
          font-size: 9.5px;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: var(--ink-3);
          font-weight: 500;
        }
        .name {
          font-size: 13px;
          line-height: 1.35;
          color: var(--ink);
          margin-top: 1px;
        }
        .provenance {
          font-size: 10.5px;
          color: var(--ink-4);
          margin-top: 4px;
          letter-spacing: 0.02em;
        }
      `}</style>
    </article>
  );
}
