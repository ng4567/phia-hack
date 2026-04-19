'use client';

// StylistInboxRow — one row in the stylist's unified inbox. Visual
// anatomy:
//   ┌─────────────────────────────────────────────────────────────┐
//   │ [avatar]  Phoebe Gates                          12m ago   • │
//   │           "Saw the wedding — I pulled a look that…"          │
//   │           LOOK-SHARE · @jess.styles                          │
//   └─────────────────────────────────────────────────────────────┘
//
// The unread dot at the right is shown only when `unread > 0`. The row
// is a button — clicking navigates to `/clients/[id]#chat` so the
// detail page's chat rail is scrolled / focused.

import { useRouter } from 'next/navigation';

import type { Client } from '@/lib/mock';
import type { ChatMessage } from '@/lib/mock/types';
import { cx } from '@/lib/utils';

export interface StylistInboxRowProps {
  client: Client;
  lastMessage: ChatMessage | null;
  unread: number;
}

function formatRelativeTimestamp(iso: string): string {
  try {
    const then = new Date(iso).getTime();
    const now = Date.now();
    const ms = now - then;
    const m = Math.round(ms / (1000 * 60));
    if (m < 1) return 'just now';
    if (m < 60) return `${m}m ago`;
    const h = Math.round(m / 60);
    if (h < 24) return `${h}h ago`;
    const d = Math.round(h / 24);
    if (d < 7) return `${d}d ago`;
    const date = new Date(iso);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  } catch {
    return '';
  }
}

function previewFor(message: ChatMessage | null): string {
  if (!message) return 'No messages yet — say hi.';
  if (message.kind === 'look-share') {
    return `Shared a look — ${message.body || 'new look for you'}`;
  }
  if (message.kind === 'system') {
    return message.body;
  }
  return message.body;
}

export function StylistInboxRow({
  client,
  lastMessage,
  unread,
}: StylistInboxRowProps) {
  const router = useRouter();

  const hasUnread = unread > 0;
  const senderLabel = lastMessage
    ? lastMessage.sender === 'client'
      ? client.name.split(' ')[0]
      : 'You'
    : '';
  const stamp = lastMessage ? formatRelativeTimestamp(lastMessage.createdAt) : '';

  return (
    <button
      type="button"
      className={cx('sir-row', hasUnread && 'sir-unread')}
      onClick={() => router.push(`/clients/${client.id}#chat`)}
      aria-label={`Open conversation with ${client.name}${
        hasUnread ? `, ${unread} new` : ''
      }`}
    >
      <div
        className="sir-avatar"
        style={{ backgroundImage: `url(${client.photoUrl})` }}
        aria-hidden="true"
      />

      <div className="sir-body">
        <div className="sir-head">
          <span className="sir-name">{client.name}</span>
          <span className="sir-time">{stamp}</span>
        </div>
        <div className="sir-preview">
          {senderLabel && <span className="sir-sender">{senderLabel}:</span>}{' '}
          <span className="sir-msg">{previewFor(lastMessage)}</span>
        </div>
        <div className="sir-foot">
          {lastMessage?.kind === 'look-share' ? (
            <span className="sir-kind sir-kind-look">Look share</span>
          ) : (
            <span className="sir-kind sir-kind-msg">Message</span>
          )}
          <span className="sir-sep" aria-hidden="true" />
          <span className="sir-handle">{client.location}</span>
        </div>
      </div>

      {hasUnread && (
        <div className="sir-badge" aria-label={`${unread} unread`}>
          <span className="sir-badge-count">{unread}</span>
        </div>
      )}

      <style jsx>{`
        .sir-row {
          display: grid;
          grid-template-columns: 52px 1fr auto;
          gap: 16px;
          align-items: flex-start;
          width: 100%;
          padding: 18px 22px;
          text-align: left;
          background: var(--card);
          border: 1px solid var(--line);
          border-radius: var(--radius);
          box-shadow: var(--shadow-sm);
          transition:
            transform .2s cubic-bezier(.2,.7,.2,1),
            box-shadow .2s ease,
            border-color .18s ease;
          color: var(--ink);
        }
        .sir-row:hover {
          transform: translateY(-2px);
          box-shadow: var(--shadow-md);
          border-color: var(--line-2);
        }
        .sir-row:focus-visible {
          outline: 2px solid var(--ink-3);
          outline-offset: 3px;
        }
        .sir-unread {
          background: #FEFDFB;
        }

        .sir-avatar {
          width: 52px;
          height: 52px;
          border-radius: 50%;
          background: var(--bg-sub) center/cover no-repeat;
          flex-shrink: 0;
        }

        .sir-body {
          min-width: 0;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .sir-head {
          display: flex;
          justify-content: space-between;
          align-items: baseline;
          gap: 10px;
        }
        .sir-name {
          font-size: 15px;
          font-weight: 500;
          letter-spacing: -0.005em;
        }
        .sir-unread .sir-name { font-weight: 600; }
        .sir-time {
          font-size: 11px;
          letter-spacing: 0.04em;
          color: var(--ink-3);
          white-space: nowrap;
          flex-shrink: 0;
        }

        .sir-preview {
          font-size: 13px;
          color: var(--ink-2);
          line-height: 1.4;
          overflow: hidden;
          text-overflow: ellipsis;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          line-clamp: 2;
          -webkit-box-orient: vertical;
        }
        .sir-sender {
          color: var(--ink-3);
          font-size: 12px;
        }
        .sir-unread .sir-msg { color: var(--ink); }

        .sir-foot {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 10px;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: var(--ink-4);
          margin-top: 2px;
        }
        .sir-kind {
          padding: 2px 8px;
          border-radius: 999px;
          font-size: 9.5px;
          letter-spacing: 0.12em;
          font-weight: 500;
        }
        .sir-kind-look {
          background: var(--accent-soft);
          color: var(--accent);
        }
        .sir-kind-msg {
          background: var(--bg-sub);
          color: var(--ink-3);
        }
        .sir-sep {
          width: 3px;
          height: 3px;
          border-radius: 50%;
          background: var(--ink-4);
        }
        .sir-handle { font-size: 10px; }

        .sir-badge {
          align-self: center;
          min-width: 26px;
          height: 24px;
          padding: 0 8px;
          border-radius: 999px;
          background: var(--accent);
          color: var(--card);
          display: inline-flex;
          align-items: center;
          justify-content: center;
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 0.02em;
          box-shadow: 0 2px 6px rgba(217,119,87,0.32);
          flex-shrink: 0;
        }
        .sir-badge-count { font-variant-numeric: tabular-nums; }
      `}</style>
    </button>
  );
}
