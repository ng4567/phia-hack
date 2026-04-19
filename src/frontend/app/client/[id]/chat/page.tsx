'use client';

// Customer chat — full-height ChatThread + ChatComposer, with a small
// "Chat with Jess Martell · your stylist" header above the thread.
//
// - Thread stretches to fill. Composer pinned to the bottom.
// - `?prefill=...` seeds the composer (used by NextEventCard's CTA).
// - sender = 'client' — the stylist types from the /clients/[id] rail.

import { Suspense } from 'react';
import { useParams, useSearchParams } from 'next/navigation';

import { ClientNavTabs } from '@/components/client/ClientNavTabs';
import { ChatThread } from '@/components/chat/ChatThread';
import { ChatComposer } from '@/components/chat/ChatComposer';
import { threadIdFor } from '@/lib/chatStore';
import { MOCK } from '@/lib/mock';

export default function ClientChatPage() {
  return (
    <Suspense fallback={null}>
      <ClientChatInner />
    </Suspense>
  );
}

function ClientChatInner() {
  const { id } = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const prefill = searchParams.get('prefill') ?? undefined;

  const threadId = threadIdFor(id, MOCK.stylist.handle);

  return (
    <>
      <ClientNavTabs clientId={id} />

      <main className="screen chat-page" data-screen-label="Client · Chat">
        <div className="chat-shell">
          <div className="chat-frame">
            {/* Thread header */}
            <header className="thread-head">
              <div
                className="head-avatar"
                style={{ backgroundImage: `url(${MOCK.stylist.photoUrl})` }}
                aria-hidden="true"
              />
              <div className="head-meta">
                <div className="head-name serif-italic">
                  Chat with {MOCK.stylist.name}
                </div>
                <div className="head-sub">
                  <span className="head-dot" />
                  <span>Your stylist · typically replies within the hour</span>
                </div>
              </div>
              <div className="head-stats">
                <div className="micro">Thread</div>
                <div className="head-stat-num">{threadId.split('-')[0]}</div>
              </div>
            </header>

            {/* Messages */}
            <div className="thread-wrap">
              <ChatThread threadId={threadId} />
            </div>

            {/* Composer */}
            <ChatComposer
              threadId={threadId}
              sender="client"
              prefill={prefill}
              placeholder={`Message ${MOCK.stylist.name.split(' ')[0]}…`}
            />
          </div>
        </div>

        <style jsx>{`
          .chat-page {
            min-height: calc(100vh - 60px);
            display: flex;
            flex-direction: column;
            padding-bottom: 0;
          }
          .chat-shell {
            flex: 1;
            max-width: 820px;
            width: 100%;
            margin: 24px auto 24px;
            padding: 0 24px;
            display: flex;
            flex-direction: column;
            min-height: calc(100vh - 120px);
          }
          .chat-frame {
            flex: 1;
            display: flex;
            flex-direction: column;
            background: var(--card);
            border: 1px solid var(--line);
            border-radius: var(--radius-xl);
            box-shadow: var(--shadow-sm);
            overflow: hidden;
            min-height: 600px;
          }

          .thread-head {
            display: flex;
            align-items: center;
            gap: 14px;
            padding: 18px 22px;
            border-bottom: 1px solid var(--line);
            background: var(--bg);
          }
          .head-avatar {
            width: 44px;
            height: 44px;
            border-radius: 50%;
            background: var(--bg-sub) center/cover no-repeat;
            flex-shrink: 0;
          }
          .head-meta {
            display: flex;
            flex-direction: column;
            gap: 3px;
            flex: 1;
            min-width: 0;
          }
          .head-name {
            font-size: 20px;
            line-height: 1.1;
            color: var(--ink);
            letter-spacing: -0.005em;
          }
          .head-sub {
            display: inline-flex;
            align-items: center;
            gap: 8px;
            font-size: 11.5px;
            color: var(--ink-3);
          }
          .head-dot {
            width: 7px;
            height: 7px;
            border-radius: 50%;
            background: var(--sage);
            box-shadow: 0 0 0 3px rgba(122, 132, 113, 0.18);
          }
          .head-stats {
            display: flex;
            flex-direction: column;
            align-items: flex-end;
            gap: 2px;
          }
          .head-stat-num {
            font-family: var(--font-serif), Georgia, serif;
            font-style: italic;
            font-size: 18px;
            color: var(--ink-2);
            letter-spacing: -0.01em;
            text-transform: capitalize;
          }

          .thread-wrap {
            flex: 1;
            display: flex;
            flex-direction: column;
            min-height: 0;
          }

          @media (max-width: 640px) {
            .chat-shell {
              padding: 0 14px;
              margin: 16px auto;
            }
            .head-stats {
              display: none;
            }
          }
        `}</style>
      </main>
    </>
  );
}
