'use client';

// NextEventCard — hero-sized card on the home dashboard for the soonest
// upcoming event across Google Calendar + Outlook. Day chip top-right
// (accent); occasion in serif-italic; location in ink-3; CTA that
// navigates to the chat page with a prefilled trigger phrase.

import { useRouter } from 'next/navigation';
import { useMemo } from 'react';

import type { CalendarEvent } from '@/lib/mock/types';

export interface NextEventCardProps {
  clientId: string;
  events: CalendarEvent[];
  /** Reference date — defaults to "now". Exposed for demo determinism. */
  now?: Date;
}

function daysUntil(iso: string, ref: Date): number {
  const d = new Date(iso);
  const msPerDay = 86_400_000;
  // Normalize to midnight local time so "today" == 0 rather than ~0.3.
  const refMid = new Date(ref.getFullYear(), ref.getMonth(), ref.getDate());
  const evMid = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  return Math.round((evMid.getTime() - refMid.getTime()) / msPerDay);
}

function weekdayShort(iso: string): string {
  const d = new Date(iso);
  return d
    .toLocaleDateString('en-US', { weekday: 'short' })
    .toUpperCase();
}

function formatTimeRange(startIso: string, endIso: string): string {
  const start = new Date(startIso);
  const end = new Date(endIso);
  const fmt = (d: Date) =>
    d
      .toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      })
      .toLowerCase()
      .replace(' ', '');
  return `${fmt(start)} – ${fmt(end)}`;
}

function prettyDateLong(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  });
}

export function NextEventCard({ clientId, events, now = new Date() }: NextEventCardProps) {
  const router = useRouter();

  const next = useMemo<CalendarEvent | null>(() => {
    if (!events || events.length === 0) return null;
    const future = events
      .filter((e) => new Date(e.start).getTime() >= now.getTime() - 3_600_000)
      .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());
    return future[0] ?? events[0];
  }, [events, now]);

  if (!next) {
    return (
      <div className="next-event empty">
        <div className="micro">Your week</div>
        <div className="serif-italic empty-title">Nothing on the horizon.</div>
        <div className="empty-sub">
          When Google Calendar or Outlook surfaces something, it will land here.
        </div>

        <style jsx>{`
          .next-event.empty {
            background: var(--card);
            border: 1px solid var(--line);
            border-radius: var(--radius-xl);
            padding: 28px 30px 30px;
            box-shadow: var(--shadow-sm);
            min-height: 220px;
            display: flex;
            flex-direction: column;
            gap: 8px;
          }
          .empty-title {
            font-size: 28px;
            line-height: 1.15;
            color: var(--ink);
          }
          .empty-sub {
            font-size: 13px;
            color: var(--ink-3);
            max-width: 320px;
            line-height: 1.45;
          }
        `}</style>
      </div>
    );
  }

  const days = daysUntil(next.start, now);
  const wk = weekdayShort(next.start);
  const chip = days === 0 ? 'TODAY' : days === 1 ? `${wk} · TOMORROW` : `${wk} · ${days} DAYS`;
  const location = next.location || 'Location TBD';
  const dressCode = next.dress_code || 'dress code open';
  const range = formatTimeRange(next.start, next.end);
  const longDate = prettyDateLong(next.start);

  const handleAskJess = () => {
    const prefill = `Dress me for ${next.title} on ${longDate}.`;
    router.push(`/client/${clientId}/chat?prefill=${encodeURIComponent(prefill)}`);
  };

  return (
    <div className="next-event">
      <div className="day-chip">{chip}</div>

      <div className="micro eyebrow">Next on your calendar</div>
      <h3 className="serif-italic title">{next.title}</h3>

      <div className="meta-line">
        <span className="meta-location">{location}</span>
        <span className="dot-sep" aria-hidden="true">·</span>
        <span className="meta-code">{dressCode}</span>
      </div>

      <div className="meta-time">{range}</div>

      {next.notes && (
        <p className="note">{next.notes}</p>
      )}

      <button type="button" className="cta" onClick={handleAskJess}>
        <span className="cta-label">Ask Jess for a look</span>
        <span className="cta-arrow" aria-hidden="true">→</span>
      </button>

      <style jsx>{`
        .next-event {
          position: relative;
          background: var(--card);
          border: 1px solid var(--line);
          border-radius: var(--radius-xl);
          padding: 28px 30px 26px;
          box-shadow: var(--shadow-sm);
          min-height: 220px;
          display: flex;
          flex-direction: column;
          gap: 10px;
          overflow: hidden;
        }
        .next-event::before {
          content: '';
          position: absolute;
          inset: auto -60px -80px auto;
          width: 240px;
          height: 240px;
          background: radial-gradient(
            circle at center,
            rgba(217, 119, 87, 0.12) 0%,
            rgba(217, 119, 87, 0) 70%
          );
          pointer-events: none;
        }

        .day-chip {
          position: absolute;
          top: 22px;
          right: 24px;
          padding: 6px 12px;
          border-radius: 999px;
          background: var(--accent);
          color: #fff;
          font-size: 10px;
          letter-spacing: 0.18em;
          font-weight: 600;
          line-height: 1;
          box-shadow: 0 1px 2px rgba(217, 119, 87, 0.28);
        }

        .eyebrow {
          margin-top: 2px;
        }
        .title {
          font-size: 30px;
          line-height: 1.1;
          color: var(--ink);
          margin: 2px 0 4px;
          letter-spacing: -0.01em;
          max-width: 82%;
        }

        .meta-line {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 13px;
          color: var(--ink-3);
          flex-wrap: wrap;
        }
        .meta-location {
          color: var(--ink-2);
        }
        .dot-sep {
          color: var(--ink-4);
        }
        .meta-code {
          text-transform: lowercase;
          font-variant: small-caps;
          letter-spacing: 0.04em;
        }
        .meta-time {
          font-size: 12px;
          color: var(--ink-3);
          font-variant-numeric: tabular-nums;
        }

        .note {
          font-size: 12.5px;
          color: var(--ink-3);
          line-height: 1.5;
          margin: 6px 0 0;
          padding-left: 12px;
          border-left: 2px solid var(--accent-soft);
          max-width: 520px;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        .cta {
          margin-top: auto;
          align-self: flex-start;
          display: inline-flex;
          align-items: center;
          gap: 10px;
          padding: 10px 8px 10px 18px;
          border-radius: 999px;
          background: var(--ink);
          color: var(--card);
          font-size: 12.5px;
          font-weight: 500;
          transition: transform 0.25s cubic-bezier(0.2, 0.7, 0.2, 1),
            background 0.2s ease;
        }
        .cta:hover {
          background: #000;
          transform: translateY(-1px);
        }
        .cta:active {
          transform: translateY(0);
        }
        .cta-arrow {
          width: 28px;
          height: 28px;
          border-radius: 999px;
          background: rgba(255, 255, 255, 0.14);
          display: inline-flex;
          align-items: center;
          justify-content: center;
          font-size: 13px;
          transition: transform 0.3s cubic-bezier(0.2, 0.7, 0.2, 1);
        }
        .cta:hover .cta-arrow {
          transform: translateX(2px);
        }
      `}</style>
    </div>
  );
}
