'use client';

// UpcomingEventsList — compact vertical list of upcoming calendar events.
// Designed for reuse across the client home dashboard and the stylist
// right-rail. Takes events as a prop — the caller owns the source blend
// (Google + Outlook) and sort order.

import type { CalendarEvent } from '@/lib/mock/types';

export interface UpcomingEventsListProps {
  events: CalendarEvent[];
  /** Optional click handler per event. */
  onSelect?: (event: CalendarEvent) => void;
  /** Cap the rendered list (default 4). */
  limit?: number;
  /** Reference date for day-chip math. Defaults to "now". */
  now?: Date;
  /** Label shown in the compact "empty" state. */
  emptyLabel?: string;
}

function dayChip(iso: string, ref: Date): { weekday: string; day: number; relative: string } {
  const d = new Date(iso);
  const weekday = d
    .toLocaleDateString('en-US', { weekday: 'short' })
    .toUpperCase();
  const day = d.getDate();
  const msPerDay = 86_400_000;
  const refMid = new Date(ref.getFullYear(), ref.getMonth(), ref.getDate());
  const evMid = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const diff = Math.round((evMid.getTime() - refMid.getTime()) / msPerDay);
  let relative: string;
  if (diff === 0) relative = 'today';
  else if (diff === 1) relative = 'tomorrow';
  else if (diff > 1 && diff < 7) relative = `in ${diff} days`;
  else if (diff >= 7 && diff < 14) relative = 'next week';
  else if (diff >= 14) relative = `${Math.round(diff / 7)} wks`;
  else if (diff === -1) relative = 'yesterday';
  else relative = `${Math.abs(diff)}d ago`;
  return { weekday, day, relative };
}

function sourceBadge(source: CalendarEvent['source']): string {
  if (source === 'google_calendar') return 'Google';
  return 'Outlook';
}

export function UpcomingEventsList({
  events,
  onSelect,
  limit = 4,
  now = new Date(),
  emptyLabel = 'No upcoming events.',
}: UpcomingEventsListProps) {
  const sliced = events.slice(0, limit);

  if (sliced.length === 0) {
    return (
      <div className="upcoming-empty">
        <span>{emptyLabel}</span>
        <style jsx>{`
          .upcoming-empty {
            padding: 14px 4px;
            font-size: 12.5px;
            color: var(--ink-3);
            font-style: italic;
          }
        `}</style>
      </div>
    );
  }

  return (
    <ul className="upcoming-list">
      {sliced.map((e) => {
        const chip = dayChip(e.start, now);
        const clickable = Boolean(onSelect);
        return (
          <li
            key={e.id}
            className={`row ${clickable ? 'clickable' : ''}`}
            onClick={clickable ? () => onSelect?.(e) : undefined}
            tabIndex={clickable ? 0 : undefined}
            onKeyDown={
              clickable
                ? (ev) => {
                    if (ev.key === 'Enter' || ev.key === ' ') {
                      ev.preventDefault();
                      onSelect?.(e);
                    }
                  }
                : undefined
            }
          >
            <div className="chip">
              <div className="chip-weekday">{chip.weekday}</div>
              <div className="chip-day">{chip.day}</div>
            </div>
            <div className="body">
              <div className="title-line">
                <span className="title">{e.title}</span>
                <span className="src-badge">{sourceBadge(e.source)}</span>
              </div>
              <div className="meta">
                <span className="meta-location">{e.location || 'Location TBD'}</span>
                <span className="dot-sep" aria-hidden="true">·</span>
                <span className="meta-rel">{chip.relative}</span>
              </div>
            </div>
            {clickable && (
              <span className="arrow" aria-hidden="true">
                →
              </span>
            )}
          </li>
        );
      })}

      <style jsx>{`
        .upcoming-list {
          list-style: none;
          margin: 0;
          padding: 0;
          display: flex;
          flex-direction: column;
        }
        .row {
          display: grid;
          grid-template-columns: 44px 1fr auto;
          align-items: center;
          gap: 14px;
          padding: 12px 4px;
          border-top: 1px solid var(--line);
          transition:
            background 0.2s ease,
            padding 0.2s cubic-bezier(0.2, 0.7, 0.2, 1);
        }
        .row:first-child {
          border-top: none;
        }
        .row.clickable {
          cursor: pointer;
        }
        .row.clickable:hover {
          background: var(--bg);
          padding-left: 10px;
          padding-right: 10px;
        }
        .row.clickable:hover .arrow {
          transform: translateX(3px);
          color: var(--accent);
        }

        .chip {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          width: 44px;
          height: 44px;
          border-radius: 10px;
          background: var(--bg);
          border: 1px solid var(--line);
          gap: 1px;
        }
        .chip-weekday {
          font-size: 9px;
          letter-spacing: 0.14em;
          color: var(--ink-3);
          font-weight: 600;
          line-height: 1;
        }
        .chip-day {
          font-family: var(--font-serif), Georgia, serif;
          font-size: 20px;
          line-height: 1;
          color: var(--ink);
          letter-spacing: -0.01em;
        }

        .body {
          display: flex;
          flex-direction: column;
          gap: 3px;
          min-width: 0;
        }
        .title-line {
          display: flex;
          align-items: center;
          gap: 8px;
          min-width: 0;
        }
        .title {
          font-size: 13.5px;
          color: var(--ink);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          min-width: 0;
        }
        .src-badge {
          flex-shrink: 0;
          font-size: 9px;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: var(--ink-4);
          font-weight: 500;
          padding: 2px 6px;
          border-radius: 4px;
          background: var(--bg);
        }
        .meta {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 11.5px;
          color: var(--ink-3);
          min-width: 0;
        }
        .meta-location {
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          min-width: 0;
        }
        .dot-sep {
          color: var(--ink-4);
        }
        .meta-rel {
          flex-shrink: 0;
          color: var(--ink-3);
        }

        .arrow {
          color: var(--ink-4);
          font-size: 13px;
          transition:
            transform 0.25s cubic-bezier(0.2, 0.7, 0.2, 1),
            color 0.2s ease;
        }
      `}</style>
    </ul>
  );
}
