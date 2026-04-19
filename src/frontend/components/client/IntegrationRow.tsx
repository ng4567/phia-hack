'use client';

// IntegrationRow — one row in the settings page for a single integration.
//
// Shows: service glyph + title + email sub-line · a metrics block with
// parsed counts and the "next up" line · last-sync micro · and a
// [ Disconnect / Reconnect ] toggle button on the right. Writes through
// `useIntegrationsStore`.

import { useIntegrationsStore } from '@/lib/integrationsStore';
import type { IntegrationKey } from '@/lib/integrationsStore';

export interface IntegrationRowProps {
  integrationKey: IntegrationKey;
  title: string;
  accountEmail: string;
  /** Two short lines describing what we've pulled. */
  primaryMetric: string;
  secondaryMetric?: string;
  /** Minutes-since-last-sync for display. */
  lastSyncMinutesAgo?: number;
  /** Override the default service icon. */
  glyph?: React.ReactNode;
}

function gmailIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" width="22" height="22" aria-hidden="true">
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
      width="22"
      height="22"
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
    <svg viewBox="0 0 24 24" fill="none" width="22" height="22" aria-hidden="true">
      <rect x="2.5" y="5" width="13" height="14" rx="1.5" fill="#0078D4" />
      <path
        d="M9 8.5c-1.9 0-3 1.6-3 3.5s1.1 3.5 3 3.5 3-1.6 3-3.5-1.1-3.5-3-3.5zm0 5.5c-.9 0-1.4-.9-1.4-2s.5-2 1.4-2 1.4.9 1.4 2-.5 2-1.4 2z"
        fill="#fff"
      />
      <path d="M15.5 9v6l5 2.5V6.5L15.5 9z" fill="#50D9FF" />
    </svg>
  );
}

function defaultGlyph(key: IntegrationKey): React.ReactNode {
  if (key === 'gmail') return gmailIcon();
  if (key === 'googleCalendar') return calendarIcon();
  return outlookIcon();
}

function syncLabel(minutes: number | undefined): string {
  if (minutes === undefined) return 'Last sync: —';
  if (minutes < 1) return 'Last sync: just now';
  if (minutes < 60) return `Last sync: ${minutes} minutes ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `Last sync: ${hours} hour${hours === 1 ? '' : 's'} ago`;
  const days = Math.round(hours / 24);
  return `Last sync: ${days} day${days === 1 ? '' : 's'} ago`;
}

export function IntegrationRow({
  integrationKey,
  title,
  accountEmail,
  primaryMetric,
  secondaryMetric,
  lastSyncMinutesAgo = 2,
  glyph,
}: IntegrationRowProps) {
  const connected = useIntegrationsStore((s) => s[integrationKey]);
  const toggle = useIntegrationsStore((s) => s.toggle);

  const sync = connected ? syncLabel(lastSyncMinutesAgo) : 'Last sync: paused';

  return (
    <div className={`irow ${connected ? 'on' : 'off'}`}>
      <div className="irow-left">
        <div className="irow-glyph">{glyph ?? defaultGlyph(integrationKey)}</div>
        <div className="irow-ident">
          <div className="irow-head">
            <span className="irow-title">{title}</span>
            <span className={`irow-status ${connected ? 'ok' : 'paused'}`}>
              <span className={`irow-dot ${connected ? 'on' : 'off'}`} />
              {connected ? 'Connected' : 'Paused'}
            </span>
          </div>
          <div className="irow-email">{accountEmail}</div>
        </div>
      </div>

      <div className="irow-metrics">
        <div className="metric-primary">{primaryMetric}</div>
        {secondaryMetric && <div className="metric-secondary">{secondaryMetric}</div>}
        <div className="metric-sync">{sync}</div>
      </div>

      <div className="irow-action">
        <button
          type="button"
          className={`toggle-btn ${connected ? 'disconnect' : 'reconnect'}`}
          onClick={() => toggle(integrationKey)}
          aria-pressed={connected}
        >
          {connected ? 'Disconnect' : 'Reconnect'}
        </button>
      </div>

      <style jsx>{`
        .irow {
          display: grid;
          grid-template-columns: minmax(220px, 1.1fr) minmax(240px, 1.4fr) auto;
          gap: 28px;
          align-items: center;
          padding: 22px 26px;
          background: var(--card);
          border: 1px solid var(--line);
          border-radius: var(--radius-lg);
          box-shadow: var(--shadow-sm);
          transition:
            background 0.25s ease,
            border-color 0.25s ease;
        }
        .irow.off {
          background: #FBFAF7;
        }

        .irow-left {
          display: flex;
          align-items: center;
          gap: 16px;
          min-width: 0;
        }
        .irow-glyph {
          width: 44px;
          height: 44px;
          border-radius: 12px;
          background: var(--bg);
          border: 1px solid var(--line);
          display: inline-flex;
          align-items: center;
          justify-content: center;
          color: var(--ink-2);
          flex-shrink: 0;
        }
        .irow-ident {
          display: flex;
          flex-direction: column;
          gap: 4px;
          min-width: 0;
        }
        .irow-head {
          display: flex;
          align-items: center;
          gap: 12px;
          flex-wrap: wrap;
        }
        .irow-title {
          font-size: 16px;
          color: var(--ink);
          font-weight: 500;
          letter-spacing: -0.005em;
        }
        .irow-status {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-size: 10.5px;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          font-weight: 500;
        }
        .irow-status.ok {
          color: var(--sage);
        }
        .irow-status.paused {
          color: var(--accent);
        }
        .irow-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
        }
        .irow-dot.on {
          background: var(--sage);
          box-shadow: 0 0 0 3px rgba(122, 132, 113, 0.18);
        }
        .irow-dot.off {
          background: var(--accent);
          box-shadow: 0 0 0 3px rgba(217, 119, 87, 0.16);
        }
        .irow-email {
          font-size: 12.5px;
          color: var(--ink-3);
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .irow-metrics {
          display: flex;
          flex-direction: column;
          gap: 3px;
          min-width: 0;
        }
        .metric-primary {
          font-size: 13px;
          color: var(--ink);
          line-height: 1.45;
        }
        .metric-secondary {
          font-size: 12.5px;
          color: var(--ink-2);
          line-height: 1.45;
        }
        .metric-sync {
          font-size: 10.5px;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: var(--ink-4);
          margin-top: 4px;
          font-variant-numeric: tabular-nums;
        }

        .irow-action {
          display: flex;
          justify-content: flex-end;
        }
        .toggle-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          padding: 10px 18px;
          border-radius: 999px;
          font-size: 12px;
          font-weight: 500;
          letter-spacing: 0.02em;
          transition:
            transform 0.2s cubic-bezier(0.2, 0.7, 0.2, 1),
            background 0.2s ease,
            color 0.2s ease,
            border-color 0.2s ease;
        }
        .toggle-btn.disconnect {
          background: var(--card);
          color: var(--ink-2);
          border: 1px solid var(--line-2);
        }
        .toggle-btn.disconnect:hover {
          background: var(--bg);
          color: var(--ink);
          border-color: rgba(26, 24, 22, 0.24);
        }
        .toggle-btn.reconnect {
          background: var(--accent);
          color: #fff;
          border: 1px solid var(--accent);
          box-shadow: 0 1px 2px rgba(217, 119, 87, 0.28);
        }
        .toggle-btn.reconnect:hover {
          background: #C96945;
          transform: translateY(-1px);
        }
        .toggle-btn:active {
          transform: translateY(0) scale(0.98);
        }

        @media (max-width: 880px) {
          .irow {
            grid-template-columns: 1fr;
            gap: 18px;
            padding: 20px;
          }
          .irow-action {
            justify-content: flex-start;
          }
        }
      `}</style>
    </div>
  );
}
