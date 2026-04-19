'use client';

// LookShareCard — compact inline card shown inside a chat bubble when
// `ChatMessage.kind === 'look-share'`. Clicking navigates to the existing
// `/looks/[id]/view` result screen. ~280px wide to sit comfortably inside
// the 320px chat bubble max.

import { useRouter } from 'next/navigation';
import { getLook } from '@/lib/mock';

export interface LookShareCardProps {
  lookId: string;
  /** Body of the parent message — used as the occasion subtitle */
  body: string;
}

export function LookShareCard({ lookId, body }: LookShareCardProps) {
  const router = useRouter();
  const look = getLook(lookId);

  const cover = look?.coverUrl ?? '';
  const occasion = look?.occasion ?? body;
  const location = look?.location;

  const handleOpen = () => {
    router.push(`/looks/${lookId}/view`);
  };

  return (
    <button
      type="button"
      className="look-share-card"
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
          <span className="chip-dot" />
          Look shared
        </div>
      </div>
      <div className="meta">
        <div className="meta-micro">From Jess</div>
        <div className="occasion serif-italic">{occasion}</div>
        {location && <div className="location">{location}</div>}
        <div className="open-row">
          <span>Open look</span>
          <span className="arrow" aria-hidden="true">→</span>
        </div>
      </div>

      <style jsx>{`
        .look-share-card {
          display: flex;
          flex-direction: column;
          width: 280px;
          max-width: 100%;
          padding: 0;
          border-radius: var(--radius-lg);
          background: var(--card);
          box-shadow: var(--shadow-sm);
          border: 1px solid var(--line);
          overflow: hidden;
          text-align: left;
          transition: transform .25s cubic-bezier(.2,.7,.2,1),
                      box-shadow .25s cubic-bezier(.2,.7,.2,1);
        }
        .look-share-card:hover {
          transform: translateY(-1px);
          box-shadow: var(--shadow-md);
        }
        .look-share-card:active { transform: translateY(0); }

        .cover {
          position: relative;
          aspect-ratio: 4 / 5;
          width: 100%;
          background: var(--bg-sub) center/cover no-repeat;
        }
        .cover-placeholder {
          position: absolute; inset: 0;
          display: flex; align-items: center; justify-content: center;
          color: var(--ink-4);
          font-size: 11px;
          letter-spacing: 0.14em;
          text-transform: uppercase;
        }
        .cover-scrim {
          position: absolute; inset: 0;
          background: linear-gradient(180deg,
            rgba(26,24,22,0) 55%,
            rgba(26,24,22,0.28) 100%);
          pointer-events: none;
        }
        .cover-chip {
          position: absolute;
          top: 10px; left: 10px;
          display: inline-flex; align-items: center; gap: 6px;
          padding: 5px 10px;
          background: rgba(255,255,255,0.92);
          border-radius: 999px;
          font-size: 10.5px;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: var(--ink-2);
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
        }
        .chip-dot {
          width: 6px; height: 6px; border-radius: 50%;
          background: var(--accent);
        }

        .meta {
          padding: 14px 16px 16px;
          display: flex; flex-direction: column; gap: 4px;
        }
        .meta-micro {
          font-size: 10px;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: var(--ink-4);
          font-weight: 500;
        }
        .occasion {
          font-size: 20px;
          line-height: 1.2;
          color: var(--ink);
          margin-top: 2px;
        }
        .location {
          font-size: 12.5px;
          color: var(--ink-3);
          margin-top: 2px;
        }
        .open-row {
          margin-top: 10px;
          display: flex; align-items: center; justify-content: space-between;
          font-size: 12px;
          color: var(--accent);
          font-weight: 500;
        }
        .arrow {
          transition: transform .25s cubic-bezier(.2,.7,.2,1);
        }
        .look-share-card:hover .arrow { transform: translateX(3px); }
      `}</style>
    </button>
  );
}
