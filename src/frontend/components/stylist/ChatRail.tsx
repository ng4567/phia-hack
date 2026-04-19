'use client';

// ChatRail — the stylist-side right column on the client detail page.
// Composition:
//   ┌──────────────────────────┐
//   │ Chat with {firstName}   X │   ← sticky header
//   ├──────────────────────────┤
//   │ <ChatThread />            │   ← scrollable
//   │                           │
//   ├──────────────────────────┤
//   │ [ ✨ AI brief ]           │   ← above composer
//   │ <ChatComposer sender="s"/>│
//   └──────────────────────────┘
//
// The "Chat with …" header is deliberately understated — no meta, no
// secondary nav — so the focus is the thread itself.
//
// Opening the AI brief triggers `<AIBriefOverlay />` which renders as
// a fixed right-rail sheet (sibling portal via React tree, not an
// actual portal — the fixed-position scrim pulls it out of the rail's
// flow anyway). The overlay manages its own fetch lifecycle.

import { useState } from 'react';

import { threadIdFor } from '@/lib/chatStore';
import { MOCK, type Client } from '@/lib/mock';
import { ChatThread } from '@/components/chat/ChatThread';
import { ChatComposer } from '@/components/chat/ChatComposer';
import { Icon } from '@/components/Icon';

import { AIBriefOverlay } from './AIBriefOverlay';

export interface ChatRailProps {
  client: Client;
}

export function ChatRail({ client }: ChatRailProps) {
  const [briefOpen, setBriefOpen] = useState(false);
  const threadId = threadIdFor(client.id, MOCK.stylist.handle);
  const firstName = client.name.split(' ')[0];

  return (
    <aside className="cr-root" id="chat">
      <header className="cr-head">
        <div className="cr-head-row">
          <span className="cr-head-eyebrow">Chat</span>
          <span className="cr-head-status" aria-live="polite">
            <span className="cr-status-dot" aria-hidden="true" />
            live
          </span>
        </div>
        <h3 className="serif-italic cr-head-title">
          Chat with {firstName}
        </h3>
      </header>

      <div className="cr-thread">
        <ChatThread threadId={threadId} />
      </div>

      <div className="cr-brief-row">
        <button
          type="button"
          className="cr-brief-btn"
          onClick={() => setBriefOpen(true)}
          aria-label="Open AI brief overlay"
        >
          <span className="cr-brief-ico" aria-hidden="true">
            <Icon.spark />
          </span>
          <span className="cr-brief-label">AI brief</span>
          <span className="cr-brief-sub">
            Pull her week from calendar
          </span>
        </button>
      </div>

      <div className="cr-composer">
        <ChatComposer threadId={threadId} sender="stylist" />
      </div>

      <AIBriefOverlay
        open={briefOpen}
        clientId={client.id}
        onClose={() => setBriefOpen(false)}
      />

      <style jsx>{`
        .cr-root {
          display: flex;
          flex-direction: column;
          background: var(--card);
          border-radius: var(--radius-lg);
          box-shadow: var(--shadow-sm);
          overflow: hidden;
          min-height: 480px;
          max-height: calc(100vh - 160px);
        }

        .cr-head {
          padding: 22px 24px 16px;
          border-bottom: 1px solid var(--line);
          background:
            linear-gradient(180deg, rgba(255,255,255,1) 0%, rgba(255,255,255,0.88) 100%);
        }
        .cr-head-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 10px;
        }
        .cr-head-eyebrow {
          font-size: 10px;
          letter-spacing: 0.16em;
          text-transform: uppercase;
          color: var(--ink-3);
          font-weight: 500;
        }
        .cr-head-status {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-size: 10.5px;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: var(--sage);
        }
        .cr-status-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: var(--sage);
          box-shadow: 0 0 0 2px rgba(122,132,113,0.22);
          animation: cr-pulse 1.8s ease-in-out infinite;
        }
        @keyframes cr-pulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.15); opacity: .8; }
        }
        .cr-head-title {
          font-size: 26px;
          line-height: 1.05;
          letter-spacing: -0.01em;
          margin: 6px 0 0;
        }

        .cr-thread {
          flex: 1 1 auto;
          min-height: 0;
          display: flex;
          flex-direction: column;
        }

        .cr-brief-row {
          padding: 12px 14px 0;
          border-top: 1px solid var(--line);
        }
        .cr-brief-btn {
          width: 100%;
          display: grid;
          grid-template-columns: 32px 1fr;
          grid-template-rows: auto auto;
          grid-row-gap: 2px;
          grid-column-gap: 10px;
          align-items: center;
          padding: 10px 14px;
          border-radius: 14px;
          background: var(--accent-soft);
          border: 1px solid rgba(217,119,87,0.2);
          color: var(--ink);
          text-align: left;
          transition:
            transform .2s cubic-bezier(.2,.7,.2,1),
            background .18s ease,
            border-color .18s ease;
        }
        .cr-brief-btn:hover {
          background: #F1D9C6;
          border-color: rgba(217,119,87,0.42);
          transform: translateY(-1px);
        }
        .cr-brief-btn:active { transform: translateY(0); }
        .cr-brief-ico {
          grid-row: 1 / span 2;
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: var(--card);
          color: var(--accent);
          display: inline-flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 1px 2px rgba(217,119,87,0.18);
        }
        .cr-brief-label {
          grid-column: 2;
          font-size: 13px;
          font-weight: 500;
          letter-spacing: 0.01em;
        }
        .cr-brief-sub {
          grid-column: 2;
          font-size: 11px;
          color: var(--ink-3);
        }

        .cr-composer { /* ChatComposer brings its own top border */ }
      `}</style>
    </aside>
  );
}
