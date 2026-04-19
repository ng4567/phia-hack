'use client';

// Unified stylist inbox — one row per client, derived from the live
// chat store. Rows sort by the most recent message's createdAt so
// fresh activity floats up regardless of who sent last. Click a row
// → `/clients/[id]#chat` (the detail page scrolls / focuses the chat
// rail on mount when the `#chat` hash is present).
//
// "Unread" is a stylist-local concept tracked in `useInboxStore`:
// messages from the client that arrived *strictly after* the most
// recent `lastSeenAt[clientId]`. Opening a client detail page bumps
// that stamp.
//
// A filter strip across the top lets the stylist flip between all
// threads, only threads with unread, and threads containing a
// recently-shared look — the last one is useful during the demo
// since the share → chat round-trip lands in this view.

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';

import { MOCK } from '@/lib/mock';
import { useChatStore, threadIdFor } from '@/lib/chatStore';
import { useInboxStore } from '@/lib/inboxStore';
import { cx } from '@/lib/utils';
import { StylistInboxRow } from '@/components/stylist/StylistInboxRow';
import type { ChatMessage } from '@/lib/mock/types';

type Filter = 'all' | 'unread' | 'look-shares';

interface ThreadView {
  clientId: string;
  latest: ChatMessage | null;
  unread: number;
  hasLookShare: boolean;
}

export default function Inbox() {
  const router = useRouter();
  const [filter, setFilter] = useState<Filter>('all');

  const messagesByThread = useChatStore((s) => s.messagesByThread);
  const unreadCountFor = useInboxStore((s) => s.unreadCountFor);

  const threads = useMemo<ThreadView[]>(() => {
    return MOCK.clients.map((c) => {
      const threadId = threadIdFor(c.id, MOCK.stylist.handle);
      const msgs = messagesByThread[threadId] ?? [];
      const latest = msgs.length ? msgs[msgs.length - 1] : null;
      const unread = unreadCountFor(c.id, msgs);
      const hasLookShare = msgs.some((m) => m.kind === 'look-share');
      return { clientId: c.id, latest, unread, hasLookShare };
    });
  }, [messagesByThread, unreadCountFor]);

  // Default sort: latest message desc, clients with no messages drop
  // to the bottom but still render (so a new client with an empty
  // thread isn't invisible).
  const sorted = useMemo(() => {
    const copy = [...threads];
    copy.sort((a, b) => {
      if (!a.latest && !b.latest) return 0;
      if (!a.latest) return 1;
      if (!b.latest) return -1;
      return b.latest.createdAt.localeCompare(a.latest.createdAt);
    });
    return copy;
  }, [threads]);

  const visible = useMemo(() => {
    if (filter === 'unread') return sorted.filter((t) => t.unread > 0);
    if (filter === 'look-shares') return sorted.filter((t) => t.hasLookShare);
    return sorted;
  }, [filter, sorted]);

  const totalUnread = useMemo(
    () => threads.reduce((s, t) => s + t.unread, 0),
    [threads],
  );

  const clientById = useMemo(() => {
    const m = new Map<string, (typeof MOCK.clients)[number]>();
    for (const c of MOCK.clients) m.set(c.id, c);
    return m;
  }, []);

  return (
    <div className="screen stylist-inbox" data-screen-label="Inbox">
      <div className="in-shell">
        <header className="in-head">
          <div>
            <div className="micro">From your clients</div>
            <h1 className="serif-italic in-title">
              Inbox
              <span className="in-count">
                {totalUnread > 0 ? ` (${totalUnread} new)` : ''}
              </span>
            </h1>
          </div>
          <div className="in-filters" role="tablist">
            <button
              role="tab"
              aria-selected={filter === 'all'}
              className={cx('pill', filter === 'all' && 'active')}
              onClick={() => setFilter('all')}
            >
              All <span className="in-filter-count">· {threads.length}</span>
            </button>
            <button
              role="tab"
              aria-selected={filter === 'unread'}
              className={cx('pill', filter === 'unread' && 'active')}
              onClick={() => setFilter('unread')}
            >
              Unread
              <span className="in-filter-count"> · {totalUnread}</span>
            </button>
            <button
              role="tab"
              aria-selected={filter === 'look-shares'}
              className={cx('pill', filter === 'look-shares' && 'active')}
              onClick={() => setFilter('look-shares')}
            >
              Look shares
              <span className="in-filter-count">
                {' '}· {threads.filter((t) => t.hasLookShare).length}
              </span>
            </button>
          </div>
        </header>

        {visible.length === 0 ? (
          <div className="in-empty">
            <div className="serif-italic in-empty-title">
              {filter === 'unread'
                ? 'All caught up.'
                : filter === 'look-shares'
                ? 'No look shares yet.'
                : 'No client conversations yet.'}
            </div>
            <p className="in-empty-body">
              {filter === 'unread'
                ? 'The second a client replies, it will land here.'
                : filter === 'look-shares'
                ? 'Share your first look — it will thread into the client\u2019s chat automatically.'
                : 'Start a chat from a client\u2019s detail page to surface it here.'}
            </p>
            {filter !== 'all' && (
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => setFilter('all')}
              >
                Show all threads
              </button>
            )}
          </div>
        ) : (
          <div className="in-list">
            {visible.map((t, i) => {
              const client = clientById.get(t.clientId);
              if (!client) return null;
              return (
                <div
                  key={t.clientId}
                  className="in-row-wrap"
                  style={{ animationDelay: `${i * 40}ms` }}
                >
                  <StylistInboxRow
                    client={client}
                    lastMessage={t.latest}
                    unread={t.unread}
                  />
                </div>
              );
            })}
          </div>
        )}

        <footer className="in-foot">
          <span className="micro">
            Inbox reflects the shared chat store. Changes in other tabs
            sync here via the browser&rsquo;s storage event.
          </span>
          <button
            type="button"
            className="btn btn-ghost"
            onClick={() => router.push('/dashboard')}
          >
            Back to dashboard
          </button>
        </footer>
      </div>

      <style jsx>{`
        .in-shell {
          max-width: 1100px;
          margin: 0 auto;
          padding: 40px 32px 80px;
        }

        .in-head {
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
          gap: 24px;
          flex-wrap: wrap;
          margin-bottom: 30px;
        }
        .in-title {
          font-size: 60px;
          line-height: 1;
          letter-spacing: -0.02em;
          margin: 10px 0 0;
        }
        .in-count {
          font-family: var(--font-sans), system-ui, sans-serif;
          font-size: 18px;
          font-style: normal;
          color: var(--accent);
          letter-spacing: 0;
          margin-left: 10px;
          vertical-align: middle;
          font-weight: 500;
        }

        .in-filters {
          display: flex;
          gap: 6px;
          flex-wrap: wrap;
        }
        .in-filter-count {
          color: var(--ink-4);
          font-size: 11.5px;
        }
        .pill.active .in-filter-count { color: rgba(255,255,255,0.7); }

        .in-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .in-row-wrap {
          animation: fadeUp .45s cubic-bezier(.2,.7,.2,1) both;
        }

        .in-empty {
          background: var(--card);
          border-radius: var(--radius-lg);
          padding: 56px 28px;
          text-align: center;
          box-shadow: var(--shadow-sm);
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 12px;
        }
        .in-empty-title {
          font-size: 34px;
          line-height: 1.05;
          letter-spacing: -0.01em;
          color: var(--ink);
        }
        .in-empty-body {
          font-size: 14px;
          color: var(--ink-3);
          max-width: 48ch;
          margin: 0;
          line-height: 1.55;
        }

        .in-foot {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 20px;
          margin-top: 32px;
          padding-top: 18px;
          border-top: 1px solid var(--line);
          color: var(--ink-3);
        }

        @media (max-width: 720px) {
          .in-title { font-size: 46px; }
          .in-foot { flex-direction: column; align-items: flex-start; }
        }
      `}</style>
    </div>
  );
}
