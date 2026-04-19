'use client';

// UpcomingEventsList — compact 3-row list of the next upcoming events
// for a client, unioned from their Google Calendar + Outlook fixtures.
// Clicking a row deep-links to the Look Builder pre-seeded with a
// hand-picked set of catalog garmentIds that match the event's
// dress_code / style_keywords, plus the event title as the occasion.
//
// The EVENT_SEEDS mapping is intentional: the spec calls for the
// Rooftop engagement event to seed `g16,g3,g13` (the default demo
// board) so the Wave 2 → existing try-on demo path is continuous.
// Other events seed with plausible catalog pieces so each row actually
// goes somewhere useful even on first click.

import { useMemo } from 'react';
import { useRouter } from 'next/navigation';

import phoebeCal from '@/lib/mock/client-phoebe-calendar.json';
import phoebeOut from '@/lib/mock/client-phoebe-outlook.json';
import sophiaCal from '@/lib/mock/client-sophia-calendar.json';
import sophiaOut from '@/lib/mock/client-sophia-outlook.json';
import type { CalendarEvent } from '@/lib/mock/types';

interface EventPayload { events: CalendarEvent[]; }

const CAL_BY_CLIENT: Record<string, EventPayload> = {
  sarah: phoebeCal as EventPayload,
  maya: sophiaCal as EventPayload,
};
const OUT_BY_CLIENT: Record<string, EventPayload> = {
  sarah: phoebeOut as EventPayload,
  maya: sophiaOut as EventPayload,
};

// Hand-picked seed ids per event — chosen so each click lands on a
// sensible starting board rather than an empty builder. All ids
// reference the catalog in `lib/mock.ts` so `getGarment` resolves.
const EVENT_SEEDS: Record<string, string> = {
  // Phoebe — Google Calendar
  'evt-ph-cal-01': 'g16,g3,g13', // Rooftop engagement → demo default
  'evt-ph-cal-02': 'g6,g12,g10', // Cecilie preview → soft-tailored tonal
  'evt-ph-cal-03': 'g4,g2,g5',   // Hudson weekend → countryside layered
  'evt-ph-cal-04': 'g1,g3,g13',  // Editorial shoot → statement + moto
  // Phoebe — Outlook
  'evt-ph-out-01': 'g9,g7,g15',  // Press day → cami + trouser + hoops
  'evt-ph-out-02': 'g4,g7,g10',  // Chloé brand meeting → tonal quiet-luxury
  // Sophia — Google Calendar
  'evt-so-cal-01': 'g3,g7,g10',  // UN panel → sharp tailoring
  'evt-so-cal-02': 'g1,g7,g13',  // Gallery opening → architectural column
  // Sophia — Outlook
  'evt-so-out-01': 'g4,g7,g15',  // Atlantic Council → neutral authoritative
};

function formatDayChip(iso: string): { weekday: string; dayNum: string } {
  try {
    const d = new Date(iso);
    return {
      weekday: d
        .toLocaleDateString('en-US', { weekday: 'short' })
        .toUpperCase(),
      dayNum: d.toLocaleDateString('en-US', { day: 'numeric' }),
    };
  } catch {
    return { weekday: '---', dayNum: '--' };
  }
}

function formatRelative(iso: string, now: Date): string {
  try {
    const d = new Date(iso);
    const ms = d.getTime() - now.getTime();
    const days = Math.round(ms / (1000 * 60 * 60 * 24));
    if (days < 0) return `${Math.abs(days)}d ago`;
    if (days === 0) return 'today';
    if (days === 1) return 'tomorrow';
    if (days < 7) return `in ${days}d`;
    if (days < 30) {
      const weeks = Math.round(days / 7);
      return `in ${weeks}w`;
    }
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  } catch {
    return '';
  }
}

export interface UpcomingEventsListProps {
  clientId: string;
  /** Max rows to render (spec calls for 3). */
  limit?: number;
}

export function UpcomingEventsList({ clientId, limit = 3 }: UpcomingEventsListProps) {
  const router = useRouter();

  const events = useMemo(() => {
    const cal = CAL_BY_CLIENT[clientId]?.events ?? [];
    const out = OUT_BY_CLIENT[clientId]?.events ?? [];
    const combined = [...cal, ...out];
    combined.sort((a, b) => a.start.localeCompare(b.start));
    return combined.slice(0, limit);
  }, [clientId, limit]);

  // Reference date pinned to the dataset's "now" so the relative labels
  // make sense in demo land — the fixtures live in April 2026 and
  // pinning keeps "in 4d" from drifting into "ago" while the demo lives.
  const now = useMemo(() => new Date('2026-04-22T12:00:00Z'), []);

  const handleOpen = (ev: CalendarEvent) => {
    const seedIds = EVENT_SEEDS[ev.id] ?? '';
    const seedParam = seedIds ? `seed=${encodeURIComponent(seedIds)}&` : '';
    const occParam = `occasion=${encodeURIComponent(ev.title)}`;
    router.push(`/clients/${clientId}/new-look?${seedParam}${occParam}`);
  };

  if (events.length === 0) {
    return (
      <section className="uel-root">
        <header className="uel-head">
          <div className="micro">Upcoming</div>
          <h4 className="serif-italic uel-title">Calendar is clear</h4>
        </header>
        <p className="uel-empty">
          Nothing on the books for this client this week. Once an event
          lands in Gmail or Outlook, it&apos;ll appear here.
        </p>

        <style jsx>{`
          .uel-root {
            background: var(--card);
            border-radius: var(--radius);
            padding: 18px 20px 20px;
            box-shadow: var(--shadow-sm);
          }
          .uel-title {
            font-size: 22px;
            line-height: 1.1;
            margin: 6px 0 10px;
            letter-spacing: -0.01em;
          }
          .uel-empty {
            margin: 0;
            font-size: 12.5px;
            line-height: 1.55;
            color: var(--ink-3);
          }
        `}</style>
      </section>
    );
  }

  return (
    <section className="uel-root">
      <header className="uel-head">
        <div className="micro">Upcoming</div>
        <h4 className="serif-italic uel-title">Next {events.length}</h4>
      </header>

      <ul className="uel-list">
        {events.map((ev) => {
          const chip = formatDayChip(ev.start);
          const rel = formatRelative(ev.start, now);
          return (
            <li key={ev.id} className="uel-item">
              <button
                type="button"
                className="uel-row"
                onClick={() => handleOpen(ev)}
                aria-label={`Start new look for ${ev.title}`}
              >
                <div className="uel-chip" aria-hidden="true">
                  <span className="uel-chip-weekday">{chip.weekday}</span>
                  <span className="uel-chip-day">{chip.dayNum}</span>
                </div>
                <div className="uel-body">
                  <div className="uel-title-row">
                    <span className="uel-title-text">{ev.title}</span>
                    <span className="uel-rel">{rel}</span>
                  </div>
                  <div className="uel-meta">
                    <span className="uel-loc">{ev.location}</span>
                    <span className="uel-sep" aria-hidden="true" />
                    <span className="uel-code">{ev.dress_code}</span>
                  </div>
                </div>
                <div className="uel-arrow" aria-hidden="true">
                  <svg
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M5 12h14M13 6l6 6-6 6" />
                  </svg>
                </div>
              </button>
            </li>
          );
        })}
      </ul>

      <style jsx>{`
        .uel-root {
          background: var(--card);
          border-radius: var(--radius);
          padding: 18px 20px 18px;
          box-shadow: var(--shadow-sm);
        }
        .uel-head {
          display: flex;
          justify-content: space-between;
          align-items: baseline;
          margin-bottom: 8px;
        }
        .uel-title {
          font-size: 22px;
          line-height: 1.1;
          margin: 4px 0 0;
          letter-spacing: -0.01em;
        }

        .uel-list {
          list-style: none;
          margin: 0;
          padding: 0;
          display: flex;
          flex-direction: column;
        }
        .uel-item + .uel-item { border-top: 1px solid var(--line); }

        .uel-row {
          width: 100%;
          display: grid;
          grid-template-columns: 48px 1fr auto;
          gap: 14px;
          align-items: center;
          padding: 14px 4px;
          text-align: left;
          color: var(--ink);
          transition: background .18s ease, transform .18s ease;
          border-radius: 10px;
          margin: 0 -4px;
        }
        .uel-row:hover {
          background: var(--bg);
          transform: translateX(2px);
        }
        .uel-row:focus-visible {
          outline: 2px solid var(--ink-3);
          outline-offset: 2px;
        }

        .uel-chip {
          width: 48px;
          height: 52px;
          border-radius: 10px;
          background: var(--bg-sub);
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 2px;
          border: 1px solid var(--line);
        }
        .uel-chip-weekday {
          font-size: 9px;
          letter-spacing: 0.16em;
          font-weight: 600;
          color: var(--ink-3);
        }
        .uel-chip-day {
          font-family: var(--font-serif), Georgia, serif;
          font-size: 22px;
          line-height: 1;
          color: var(--ink);
          font-variant-numeric: tabular-nums;
        }

        .uel-body { min-width: 0; }
        .uel-title-row {
          display: flex;
          justify-content: space-between;
          align-items: baseline;
          gap: 10px;
        }
        .uel-title-text {
          font-size: 14px;
          color: var(--ink);
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .uel-rel {
          font-size: 10.5px;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: var(--ink-3);
          white-space: nowrap;
          font-weight: 500;
        }
        .uel-meta {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-top: 4px;
          font-size: 11.5px;
          color: var(--ink-3);
          min-width: 0;
        }
        .uel-loc {
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          min-width: 0;
        }
        .uel-sep {
          width: 3px;
          height: 3px;
          border-radius: 50%;
          background: var(--ink-4);
          flex-shrink: 0;
        }
        .uel-code {
          text-transform: capitalize;
          white-space: nowrap;
          flex-shrink: 0;
        }

        .uel-arrow {
          color: var(--ink-3);
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 28px;
          height: 28px;
          border-radius: 999px;
          background: var(--bg);
          border: 1px solid var(--line);
          transition: transform .2s cubic-bezier(.2,.7,.2,1), background .18s ease, color .18s ease;
          flex-shrink: 0;
        }
        .uel-row:hover .uel-arrow {
          background: var(--ink);
          border-color: var(--ink);
          color: var(--card);
          transform: translate(1px, -1px);
        }
      `}</style>
    </section>
  );
}
