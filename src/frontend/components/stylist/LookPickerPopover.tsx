'use client';

// LookPickerPopover — small floating panel the stylist opens from the
// composer to attach one of the client's saved looks into the thread.
//
// Positioning: `position: absolute` pinned to the composer's top-right
// corner via a `.picker-root` element. The parent (`.cr-composer`) is
// expected to be `position: relative`.
//
// Dismiss: clicking anywhere outside the popover OR pressing Escape
// calls `onClose()`. No portal — this panel sits in-flow so its scrim
// is the composer's own relative box.

import { useEffect, useRef } from 'react';

import { getClient, getLooksFor, type LookStatus } from '@/lib/mock';

export interface LookPickerPopoverProps {
  clientId: string;
  onPick: (lookId: string) => void;
  onClose: () => void;
  anchorRef?: React.RefObject<HTMLElement>;
}

export function LookPickerPopover({
  clientId,
  onPick,
  onClose,
}: LookPickerPopoverProps) {
  const rootRef = useRef<HTMLDivElement | null>(null);

  const looks = getLooksFor(clientId);
  const client = getClient(clientId);
  const firstName = (client?.name ?? '').split(' ')[0] ?? '';

  useEffect(() => {
    const handleMouseDown = (e: MouseEvent) => {
      const el = rootRef.current;
      if (!el) return;
      if (e.target instanceof Node && !el.contains(e.target)) {
        onClose();
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('mousedown', handleMouseDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleMouseDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

  return (
    <div
      ref={rootRef}
      className="picker-root"
      role="dialog"
      aria-label={`Saved looks for ${firstName || 'client'}`}
    >
      <div className="picker-head micro">
        Saved looks for {firstName.toUpperCase()}
      </div>

      {looks.length === 0 ? (
        <div className="picker-empty">No saved looks yet</div>
      ) : (
        <ul className="picker-list">
          {looks.map((look) => (
            <li key={look.id}>
              <button
                type="button"
                className="picker-row"
                onClick={() => {
                  onPick(look.id);
                  onClose();
                }}
              >
                <span
                  className="thumb"
                  style={
                    look.coverUrl
                      ? { backgroundImage: `url(${look.coverUrl})` }
                      : undefined
                  }
                  aria-hidden="true"
                />
                <span className="meta">
                  <span className="occasion serif-italic">{look.occasion}</span>
                  <StatusChip status={look.status} />
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}

      <style jsx>{`
        .picker-root {
          position: absolute;
          bottom: calc(100% + 8px);
          right: 8px;
          width: 260px;
          background: var(--card);
          border: 1px solid var(--line);
          border-radius: var(--radius-lg);
          box-shadow: var(--shadow-md);
          padding: 10px;
          z-index: 10;
        }

        .picker-head {
          padding: 4px 6px 8px;
          color: var(--ink-3);
        }

        .picker-empty {
          padding: 16px 8px;
          font-size: 12.5px;
          color: var(--ink-3);
          text-align: center;
        }

        .picker-list {
          list-style: none;
          margin: 0;
          padding: 0;
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .picker-row {
          width: 100%;
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 6px;
          border-radius: var(--radius-sm);
          background: transparent;
          text-align: left;
          transition: background .15s ease;
        }
        .picker-row:hover { background: var(--bg-sub); }
        .picker-row:active { background: var(--bg); }

        .thumb {
          flex-shrink: 0;
          width: 48px;
          height: 60px;
          border-radius: 6px;
          background: var(--bg-sub) center/cover no-repeat;
          border: 1px solid var(--line);
        }

        .meta {
          flex: 1 1 auto;
          min-width: 0;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .occasion {
          font-size: 14px;
          line-height: 1.25;
          color: var(--ink);
          overflow: hidden;
          text-overflow: ellipsis;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
        }
      `}</style>
    </div>
  );
}

// ─── Status chip ──────────────────────────────────────────────────────────

function StatusChip({ status }: { status: LookStatus }) {
  const isReady = status === 'ready' || status === 'shared';
  const label =
    status === 'ready' ? 'Ready'
      : status === 'shared' ? 'Shared'
      : 'Draft';

  return (
    <span className={`chip ${isReady ? 'chip-sage' : 'chip-neutral'}`}>
      {label}
      <style jsx>{`
        .chip {
          align-self: flex-start;
          display: inline-flex;
          align-items: center;
          padding: 2px 8px;
          border-radius: 999px;
          font-size: 10px;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          font-weight: 500;
        }
        .chip-sage {
          background: var(--sage-soft);
          color: var(--sage);
        }
        .chip-neutral {
          background: var(--bg-sub);
          color: var(--ink-3);
        }
      `}</style>
    </span>
  );
}
