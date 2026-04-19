'use client';

// ConnectedServicesRow — three cards on the client home dashboard.
//
// Each card shows the service name, a status dot (green + "connected" when
// useIntegrationsStore reports it, neutral + "reconnect" when off), a
// one-line metric derived from the relevant fixture, and a "synced 2m"
// subtext. Pure presentational — props only take `clientId`.
//
// Counts read from the static JSON fixtures for Phoebe. Sophia's fixtures
// are thinner; the component falls back gracefully when a key is missing.

import phoebeGmail from '@/lib/mock/client-phoebe-gmail.json';
import phoebeCalendar from '@/lib/mock/client-phoebe-calendar.json';
import phoebeOutlook from '@/lib/mock/client-phoebe-outlook.json';
import sophiaGmail from '@/lib/mock/client-sophia-gmail.json';
import sophiaCalendar from '@/lib/mock/client-sophia-calendar.json';
import sophiaOutlook from '@/lib/mock/client-sophia-outlook.json';
import type { CalendarEvent, ClosetGarment, ParsedOrderEmail } from '@/lib/mock/types';
import { useIntegrationsStore } from '@/lib/integrationsStore';

interface GmailShape {
  garments: ClosetGarment[];
  emails: ParsedOrderEmail[];
}
interface EventsShape {
  events: CalendarEvent[];
}

const GMAIL_BY_CLIENT: Record<string, GmailShape> = {
  sarah: phoebeGmail as GmailShape,
  maya: sophiaGmail as GmailShape,
};
const CALENDAR_BY_CLIENT: Record<string, EventsShape> = {
  sarah: phoebeCalendar as EventsShape,
  maya: sophiaCalendar as EventsShape,
};
const OUTLOOK_BY_CLIENT: Record<string, EventsShape> = {
  sarah: phoebeOutlook as EventsShape,
  maya: sophiaOutlook as EventsShape,
};

export interface ConnectedServicesRowProps {
  clientId: string;
}

interface ServiceCardSpec {
  key: 'gmail' | 'googleCalendar' | 'outlook';
  label: string;
  account: string;
  metric: string;
  syncedAt: string;
  glyph: React.ReactNode;
}

function gmailIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" width="20" height="20" aria-hidden="true">
      <path
        d="M3 6.5v11A2.5 2.5 0 0 0 5.5 20H9v-8.2L3.6 6a2.5 2.5 0 0 0-.6.5z"
        fill="#C5221F"
      />
      <path d="M21 6.5v11A2.5 2.5 0 0 1 18.5 20H15v-8.2L20.4 6c.4.1.6.3.6.5z" fill="#1A73E8" />
      <path d="M9 11.8V20h6v-8.2L12 9.5 9 11.8z" fill="#EA4335" />
      <path d="M9 11.8L3.6 6A2.5 2.5 0 0 1 5.5 5H9v6.8z" fill="#C5221F" />
      <path d="M15 11.8L20.4 6A2.5 2.5 0 0 0 18.5 5H15v6.8z" fill="#FBBC04" />
      <path d="M9 11.8 L12 9.5 L15 11.8 L12 14.1 Z" fill="#34A853" />
    </svg>
  );
}
function calendarIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      width="20"
      height="20"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="3.5" y="5" width="17" height="15" rx="2.5" />
      <path d="M3.5 9.5h17" />
      <path d="M8 3v4M16 3v4" />
      <circle cx="8" cy="14" r="1" fill="currentColor" stroke="none" />
      <circle cx="12" cy="14" r="1" fill="currentColor" stroke="none" />
      <circle cx="16" cy="14" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}
function outlookIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" width="20" height="20" aria-hidden="true">
      <rect x="2.5" y="5" width="13" height="14" rx="1.5" fill="#0078D4" />
      <path
        d="M9 8.5c-1.9 0-3 1.6-3 3.5s1.1 3.5 3 3.5 3-1.6 3-3.5-1.1-3.5-3-3.5zm0 5.5c-.9 0-1.4-.9-1.4-2s.5-2 1.4-2 1.4.9 1.4 2-.5 2-1.4 2z"
        fill="#fff"
      />
      <path d="M15.5 9v6l5 2.5V6.5L15.5 9z" fill="#50D9FF" />
    </svg>
  );
}

function formatRelativeMinutes(minutesAgo: number): string {
  if (minutesAgo < 1) return 'just now';
  if (minutesAgo < 60) return `synced ${minutesAgo}m ago`;
  const hours = Math.round(minutesAgo / 60);
  if (hours < 24) return `synced ${hours}h ago`;
  const days = Math.round(hours / 24);
  return `synced ${days}d ago`;
}

export function ConnectedServicesRow({ clientId }: ConnectedServicesRowProps) {
  const gmail = useIntegrationsStore((s) => s.gmail);
  const googleCalendar = useIntegrationsStore((s) => s.googleCalendar);
  const outlook = useIntegrationsStore((s) => s.outlook);

  const gmailData = GMAIL_BY_CLIENT[clientId];
  const calData = CALENDAR_BY_CLIENT[clientId];
  const outData = OUTLOOK_BY_CLIENT[clientId];

  const emailCount = gmailData?.emails?.length ?? 0;
  const garmentCount = gmailData?.garments?.length ?? 0;
  const calCount = calData?.events?.length ?? 0;
  const outCount = outData?.events?.length ?? 0;

  const firstName = clientId === 'sarah' ? 'phoebe' : 'sophia';

  const specs: ServiceCardSpec[] = [
    {
      key: 'gmail',
      label: 'Gmail',
      account: `${firstName}.gates@gmail.com`,
      metric:
        emailCount > 0
          ? `${emailCount} orders parsed · ${garmentCount} garments found`
          : 'Nothing parsed yet',
      syncedAt: formatRelativeMinutes(2),
      glyph: gmailIcon(),
    },
    {
      key: 'googleCalendar',
      label: 'Google Calendar',
      account: `${firstName}.gates@gmail.com`,
      metric: calCount > 0 ? `${calCount} upcoming events` : 'No upcoming events',
      syncedAt: formatRelativeMinutes(2),
      glyph: calendarIcon(),
    },
    {
      key: 'outlook',
      label: 'Outlook',
      account: `${firstName}@editorialcollective.co`,
      metric: outCount > 0 ? `${outCount} work events this week` : 'No work events',
      syncedAt: formatRelativeMinutes(4),
      glyph: outlookIcon(),
    },
  ];

  const connectedMap = { gmail, googleCalendar, outlook };

  return (
    <div className="connected-row">
      {specs.map((spec) => {
        const isOn = connectedMap[spec.key];
        return (
          <div key={spec.key} className={`svc ${isOn ? 'on' : 'off'}`}>
            <div className="svc-head">
              <div className="svc-glyph">{spec.glyph}</div>
              <div className="svc-status">
                <span className={`dot ${isOn ? 'dot-on' : 'dot-off'}`} />
                <span className="status-label">{isOn ? 'Connected' : 'Reconnect'}</span>
              </div>
            </div>
            <div className="svc-body">
              <div className="svc-label">{spec.label}</div>
              <div className="svc-metric serif-italic">{spec.metric}</div>
            </div>
            <div className="svc-foot">
              <span className="svc-account">{spec.account}</span>
              <span className="svc-sync">{spec.syncedAt}</span>
            </div>
          </div>
        );
      })}

      <style jsx>{`
        .connected-row {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 14px;
        }
        .svc {
          display: flex;
          flex-direction: column;
          gap: 18px;
          padding: 20px 22px 18px;
          background: var(--card);
          border-radius: var(--radius-lg);
          border: 1px solid var(--line);
          box-shadow: var(--shadow-sm);
          min-height: 160px;
          transition:
            border-color 0.25s cubic-bezier(0.2, 0.7, 0.2, 1),
            transform 0.25s cubic-bezier(0.2, 0.7, 0.2, 1);
        }
        .svc:hover {
          transform: translateY(-1px);
          border-color: var(--line-2);
        }
        .svc.off {
          background: #FBFAF7;
        }

        .svc-head {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .svc-glyph {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 32px;
          height: 32px;
          border-radius: 9px;
          background: var(--bg);
          border: 1px solid var(--line);
          color: var(--ink-2);
        }
        .svc-status {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-size: 10.5px;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: var(--ink-3);
          font-weight: 500;
        }
        .dot {
          width: 7px;
          height: 7px;
          border-radius: 50%;
        }
        .dot-on {
          background: var(--sage);
          box-shadow: 0 0 0 3px rgba(122, 132, 113, 0.18);
        }
        .dot-off {
          background: var(--ink-4);
        }
        .svc.off .status-label {
          color: var(--accent);
        }

        .svc-body {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .svc-label {
          font-size: 10.5px;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: var(--ink-3);
          font-weight: 500;
        }
        .svc-metric {
          font-size: 19px;
          line-height: 1.25;
          color: var(--ink);
          letter-spacing: -0.005em;
        }

        .svc-foot {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-top: auto;
          padding-top: 8px;
          border-top: 1px solid var(--line);
          font-size: 11px;
          color: var(--ink-3);
        }
        .svc-account {
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          max-width: 62%;
        }
        .svc-sync {
          color: var(--ink-4);
          font-variant-numeric: tabular-nums;
        }

        @media (max-width: 880px) {
          .connected-row {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}
