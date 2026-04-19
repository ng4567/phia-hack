'use client';

// ConnectedDotsCompact — a single-row strip of three integration chips
// (Gmail, Google Calendar, Outlook) that reflects the live state of
// `useIntegrationsStore`. Designed to sit in a stylist-side right rail
// as a terse "everything's on" signal next to the chat / upcoming /
// preferences blocks — not a control surface.
//
// Colors:
//   - connected   → sage dot, ink label
//   - disconnected → ink-4 dot, ink-3 label
//
// No emojis, no icons — the dot is the status. If the customer app
// later exposes a per-integration last-synced time, we can fold that in
// as a second sub-line; for now the chip is intentionally one line.

import { useIntegrationsStore } from '@/lib/integrationsStore';
import { GmailLogo, GoogleCalendarLogo, OutlookLogo } from '@/components/brand/ServiceLogo';

interface Slot {
  key: 'gmail' | 'googleCalendar' | 'outlook';
  label: string;
  Logo: (props: { size?: number }) => React.ReactElement;
}

const SLOTS: Slot[] = [
  { key: 'gmail', label: 'Gmail', Logo: GmailLogo },
  { key: 'googleCalendar', label: 'Calendar', Logo: GoogleCalendarLogo },
  { key: 'outlook', label: 'Outlook', Logo: OutlookLogo },
];

export function ConnectedDotsCompact() {
  const gmail = useIntegrationsStore((s) => s.gmail);
  const googleCalendar = useIntegrationsStore((s) => s.googleCalendar);
  const outlook = useIntegrationsStore((s) => s.outlook);
  const byKey = { gmail, googleCalendar, outlook } as const;

  return (
    <div className="cd-root" role="list" aria-label="Connected integrations">
      {SLOTS.map((slot) => {
        const on = byKey[slot.key];
        const { Logo } = slot;
        return (
          <div
            key={slot.key}
            role="listitem"
            className={`cd-chip ${on ? 'cd-on' : 'cd-off'}`}
          >
            <span className="cd-logo" aria-hidden="true">
              <Logo size={14} />
            </span>
            <span className="cd-label">{slot.label}</span>
            <span className="cd-dot" aria-hidden="true" />
          </div>
        );
      })}

      <style jsx>{`
        .cd-root {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
        }
        .cd-chip {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          padding: 4px 10px 4px 8px;
          border-radius: 999px;
          background: var(--card);
          border: 1px solid var(--line);
          font-size: 11.5px;
          letter-spacing: 0.02em;
          transition: border-color .18s ease, background .18s ease, opacity .18s ease;
        }
        .cd-chip.cd-off {
          background: var(--bg-sub);
          color: var(--ink-3);
          opacity: 0.6;
        }
        .cd-chip.cd-on { color: var(--ink-2); }
        .cd-chip.cd-on:hover { border-color: var(--line-2); }

        .cd-logo {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .cd-chip.cd-off .cd-logo { filter: grayscale(1) opacity(0.7); }

        .cd-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: var(--ink-4);
          flex-shrink: 0;
          box-shadow: 0 0 0 2px transparent;
          transition: background .18s ease, box-shadow .18s ease;
        }
        .cd-on .cd-dot {
          background: #22C55E;
          box-shadow: 0 0 0 2px rgba(34,197,94,0.25);
        }

        .cd-label { font-weight: 500; }
      `}</style>
    </div>
  );
}
