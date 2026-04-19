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
import { GmailLogo, GoogleCalendarLogo, OutlookLogo } from '@/components/brand/ServiceLogo';

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
      glyph: <GmailLogo size={22} />,
    },
    {
      key: 'googleCalendar',
      label: 'Google Calendar',
      account: `${firstName}.gates@gmail.com`,
      metric: calCount > 0 ? `${calCount} upcoming events` : 'No upcoming events',
      syncedAt: formatRelativeMinutes(2),
      glyph: <GoogleCalendarLogo size={22} />,
    },
    {
      key: 'outlook',
      label: 'Outlook',
      account: `${firstName}@editorialcollective.co`,
      metric: outCount > 0 ? `${outCount} work events this week` : 'No work events',
      syncedAt: formatRelativeMinutes(4),
      glyph: <OutlookLogo size={22} />,
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
          background: #22C55E;
          box-shadow: 0 0 0 3px rgba(34, 197, 94, 0.25);
        }
        .svc.on .status-label {
          color: #16A34A;
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
