'use client';

// ChatThread — renders the list of ChatMessages for a single threadId.
//
// Layout:
//   - Right-aligned sage-soft bubbles for sender === 'client'.
//   - Left-aligned card-white bubbles with the stylist's avatar + name for
//     sender === 'stylist'.
//   - Inline <LookShareCard /> for kind === 'look-share'.
//   - 'system' messages render as a muted, centered single line.
//
// Grouping: contiguous messages from the same sender collapse visually;
// a timestamp appears only under the last message of each such group.
//
// Auto-scrolls to the bottom on new messages.

import { useEffect, useMemo, useRef } from 'react';

import { MOCK } from '@/lib/mock';
import { useChatStore } from '@/lib/chatStore';
import type { ChatMessage } from '@/lib/mock/types';

import { LookShareCard } from './LookShareCard';

export interface ChatThreadProps {
  threadId: string;
  /** Override the stylist displayed for stylist-side bubbles (defaults to MOCK.stylist). */
  stylistName?: string;
  stylistAvatar?: string;
}

function formatTime(iso: string): string {
  try {
    const d = new Date(iso);
    let h = d.getHours();
    const m = d.getMinutes();
    const ampm = h >= 12 ? 'pm' : 'am';
    h = h % 12;
    if (h === 0) h = 12;
    return `${h}:${m.toString().padStart(2, '0')} ${ampm}`;
  } catch {
    return '';
  }
}

interface BubbleGroup {
  key: string;
  sender: ChatMessage['sender'] | 'system';
  messages: ChatMessage[];
}

function groupMessages(messages: ChatMessage[]): BubbleGroup[] {
  const out: BubbleGroup[] = [];
  for (const m of messages) {
    const bucket: BubbleGroup['sender'] = m.kind === 'system' ? 'system' : m.sender;
    const last = out[out.length - 1];
    if (last && last.sender === bucket) {
      last.messages.push(m);
    } else {
      out.push({ key: m.id, sender: bucket, messages: [m] });
    }
  }
  return out;
}

export function ChatThread({
  threadId,
  stylistName = MOCK.stylist.name,
  stylistAvatar = MOCK.stylist.photoUrl,
}: ChatThreadProps) {
  const messages = useChatStore(
    (s) => s.messagesByThread[threadId] ?? EMPTY_MESSAGES,
  );

  const groups = useMemo(() => groupMessages(messages), [messages]);

  const scrollRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    // Push to bottom whenever a new message arrives.
    el.scrollTop = el.scrollHeight;
  }, [messages.length]);

  const firstStylistName = stylistName.split(' ')[0];

  return (
    <div className="chat-thread">
      <div ref={scrollRef} className="scroll-area">
        {messages.length === 0 ? (
          <div className="empty">
            <div className="empty-eyebrow">No messages yet</div>
            <div className="empty-body serif-italic">
              Start the conversation — ask for a look for what&rsquo;s coming up.
            </div>
          </div>
        ) : (
          groups.map((group) => {
            if (group.sender === 'system') {
              return group.messages.map((m) => (
                <div key={m.id} className="system-line">
                  {m.body}
                </div>
              ));
            }
            const isClient = group.sender === 'client';
            const lastMsg = group.messages[group.messages.length - 1];
            return (
              <div
                key={group.key}
                className={`group ${isClient ? 'group-client' : 'group-stylist'}`}
              >
                {!isClient && (
                  <div
                    className="avatar-sm"
                    style={{ backgroundImage: `url(${stylistAvatar})` }}
                    aria-hidden="true"
                  />
                )}
                <div className="stack">
                  {!isClient && (
                    <div className="sender-label">{firstStylistName}</div>
                  )}
                  {group.messages.map((m) => (
                    <div
                      key={m.id}
                      className={`bubble ${
                        isClient ? 'bubble-client' : 'bubble-stylist'
                      } ${m.kind === 'look-share' ? 'bubble-look' : ''}`}
                    >
                      {m.kind === 'look-share' && m.lookId ? (
                        <div className="look-wrap">
                          {m.body && <div className="look-intro">{m.body}</div>}
                          <LookShareCard lookId={m.lookId} body={m.body} />
                        </div>
                      ) : (
                        <span className="body-text">{m.body}</span>
                      )}
                    </div>
                  ))}
                  <div className="stamp">{formatTime(lastMsg.createdAt)}</div>
                </div>
              </div>
            );
          })
        )}
      </div>

      <style jsx>{`
        .chat-thread {
          display: flex;
          flex-direction: column;
          flex: 1 1 auto;
          min-height: 0;
          width: 100%;
        }
        .scroll-area {
          flex: 1 1 auto;
          overflow-y: auto;
          overflow-x: hidden;
          padding: 20px 22px 28px;
          display: flex;
          flex-direction: column;
          gap: 18px;
          scroll-behavior: smooth;
        }
        .empty {
          margin: auto 0;
          text-align: center;
          padding: 48px 12px;
          color: var(--ink-3);
        }
        .empty-eyebrow {
          font-size: 10px;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: var(--ink-4);
          margin-bottom: 8px;
        }
        .empty-body {
          font-size: 18px;
          color: var(--ink-2);
          max-width: 320px;
          margin: 0 auto;
          line-height: 1.4;
        }
        .system-line {
          align-self: center;
          font-size: 11.5px;
          letter-spacing: 0.04em;
          color: var(--ink-4);
          padding: 4px 12px;
          border-radius: 999px;
          background: var(--bg-sub);
        }

        .group {
          display: flex;
          gap: 10px;
          animation: fadeUp .35s cubic-bezier(.2,.7,.2,1) both;
        }
        .group-client { justify-content: flex-end; }
        .group-stylist { justify-content: flex-start; }

        .avatar-sm {
          width: 28px; height: 28px; border-radius: 50%;
          background: var(--bg-sub) center/cover no-repeat;
          flex-shrink: 0;
          margin-top: 18px;
        }

        .stack {
          display: flex;
          flex-direction: column;
          gap: 4px;
          max-width: 320px;
          min-width: 0;
        }
        .group-client .stack { align-items: flex-end; }
        .group-stylist .stack { align-items: flex-start; }

        .sender-label {
          font-size: 10.5px;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: var(--ink-3);
          margin-bottom: 2px;
          font-weight: 500;
        }

        .bubble {
          padding: 10px 14px;
          border-radius: 18px;
          font-size: 13.5px;
          line-height: 1.45;
          max-width: 320px;
          word-wrap: break-word;
          overflow-wrap: anywhere;
        }
        .bubble-client {
          background: var(--sage-soft);
          color: var(--ink);
          border-bottom-right-radius: 6px;
        }
        .bubble-stylist {
          background: var(--card);
          color: var(--ink);
          border: 1px solid var(--line);
          border-bottom-left-radius: 6px;
        }
        .bubble-look {
          background: transparent !important;
          border: none !important;
          padding: 2px 0 0 !important;
        }
        .look-wrap {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .look-intro {
          font-size: 13.5px;
          line-height: 1.45;
          color: var(--ink);
          padding: 10px 14px;
          background: var(--card);
          border: 1px solid var(--line);
          border-radius: 18px;
          border-bottom-left-radius: 6px;
          max-width: 320px;
        }

        .body-text { white-space: pre-wrap; }

        .stamp {
          font-size: 11px;
          color: var(--ink-4);
          margin-top: 2px;
          padding: 0 4px;
          letter-spacing: 0.02em;
        }

        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(6px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}

// A stable empty array so the Zustand selector returns referentially-equal
// values when a thread has no messages (prevents infinite re-render loops in
// strict dev mode).
const EMPTY_MESSAGES: ChatMessage[] = [];
