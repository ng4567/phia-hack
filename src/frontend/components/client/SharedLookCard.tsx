'use client';

// SharedLookCard — wide tile for the client inbox and the home-page
// "Recent looks" strip. Reads from `getLook(lookId)`; clicking navigates
// to `/looks/[lookId]/view`.
//
// A faint "new" dot appears when look.createdAt reads as recent (the
// freeform strings seeded in MOCK.looks, e.g. "2 days ago"). Heuristic:
// strings that begin with "1 day", "2 days", or the word "today"/"hours".

import { useRouter } from 'next/navigation';

import { getLook } from '@/lib/mock';

export interface SharedLookCardProps {
  lookId: string;
  /** When true, render the compact home-page variant (narrower). */
  compact?: boolean;
}

function isRecent(createdAt: string | undefined): boolean {
  if (!createdAt) return false;
  const normalized = createdAt.trim().toLowerCase();
  if (/^today/.test(normalized)) return true;
  if (/hour(s)? ago/.test(normalized)) return true;
  if (/^1 day/.test(normalized)) return true;
  if (/^2 day/.test(normalized)) return true;
  return false;
}

export function SharedLookCard({ lookId, compact = false }: SharedLookCardProps) {
  const router = useRouter();
  const look = getLook(lookId);

  const cover = look?.coverUrl;
  const occasion = look?.occasion || 'Untitled look';
  const location = look?.location || 'Location coming soon';
  const createdAt = look?.createdAt || 'Recently shared';
  const isNew = isRecent(createdAt);

  const handleOpen = () => {
    router.push(`/looks/${lookId}/view`);
  };

  return (
    <button
      type="button"
      className={`shared-look ${compact ? 'compact' : ''}`}
      onClick={handleOpen}
      aria-label={`Open look: ${occasion}`}
    >
      <div
        className="cover"
        style={cover ? { backgroundImage: `url(${cover})` } : undefined}
      >
        {!cover && <div className="cover-placeholder">look preview</div>}
        <div className="cover-scrim" />
        <div className="cover-chip">
          <span className={`chip-dot ${isNew ? 'new' : ''}`} />
          {isNew ? 'New from Jess' : 'From Jess'}
        </div>
      </div>
      <div className="meta">
        <div className="top-row">
          <div className="micro">Shared look</div>
          <div className="timestamp">{createdAt}</div>
        </div>
        <div className="occasion serif-italic">{occasion}</div>
        <div className="location">{location}</div>
        <div className="open-row">
          <span>Open look</span>
          <span className="arrow" aria-hidden="true">→</span>
        </div>
      </div>

      <style jsx>{`
        .shared-look {
          display: flex;
          flex-direction: column;
          width: 100%;
          padding: 0;
          border-radius: var(--radius-lg);
          background: var(--card);
          box-shadow: var(--shadow-sm);
          border: 1px solid var(--line);
          overflow: hidden;
          text-align: left;
          transition:
            transform 0.3s cubic-bezier(0.2, 0.7, 0.2, 1),
            box-shadow 0.3s cubic-bezier(0.2, 0.7, 0.2, 1),
            border-color 0.2s ease;
        }
        .shared-look:hover {
          transform: translateY(-2px);
          box-shadow: var(--shadow-md);
          border-color: var(--line-2);
        }
        .shared-look:active {
          transform: translateY(-1px);
        }

        .cover {
          position: relative;
          aspect-ratio: ${compact ? '4 / 5' : '5 / 6'};
          width: 100%;
          background: var(--bg-sub) center/cover no-repeat;
        }
        .cover-placeholder {
          position: absolute;
          inset: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--ink-4);
          font-size: 11px;
          letter-spacing: 0.14em;
          text-transform: uppercase;
        }
        .cover-scrim {
          position: absolute;
          inset: 0;
          background: linear-gradient(
            180deg,
            rgba(26, 24, 22, 0) 60%,
            rgba(26, 24, 22, 0.22) 100%
          );
          pointer-events: none;
        }
        .cover-chip {
          position: absolute;
          top: 14px;
          left: 14px;
          display: inline-flex;
          align-items: center;
          gap: 7px;
          padding: 6px 12px;
          background: rgba(255, 255, 255, 0.94);
          border-radius: 999px;
          font-size: 10.5px;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: var(--ink-2);
          font-weight: 500;
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
        }
        .chip-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: var(--ink-4);
        }
        .chip-dot.new {
          background: var(--accent);
          box-shadow: 0 0 0 3px rgba(217, 119, 87, 0.2);
        }

        .meta {
          padding: 16px 18px 18px;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .top-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 2px;
        }
        .timestamp {
          font-size: 10px;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: var(--ink-4);
          font-weight: 500;
        }
        .occasion {
          font-size: ${compact ? '22px' : '26px'};
          line-height: 1.15;
          color: var(--ink);
          letter-spacing: -0.01em;
          margin-top: 2px;
        }
        .location {
          font-size: 12.5px;
          color: var(--ink-3);
          margin-top: 3px;
        }
        .open-row {
          margin-top: 12px;
          padding-top: 10px;
          border-top: 1px solid var(--line);
          display: flex;
          align-items: center;
          justify-content: space-between;
          font-size: 12px;
          color: var(--accent);
          font-weight: 500;
        }
        .arrow {
          transition: transform 0.3s cubic-bezier(0.2, 0.7, 0.2, 1);
        }
        .shared-look:hover .arrow {
          transform: translateX(4px);
        }
      `}</style>
    </button>
  );
}
