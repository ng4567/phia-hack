'use client';

// ClientNavTabs — sticky top navigation for the customer app.
//
// Layout: wordmark left · nav links middle · persona chip right.
// Active link is underlined in --accent and rendered in --ink.
//
// Chat badge: counts messages in the client <> stylist thread where
//   sender === 'stylist' AND createdAt > lastSeenAt (stored in
//   localStorage under `phia-chat-lastseen-v1`). When the user
//   navigates *to* the Chat tab, we bump lastSeenAt to "now" so the
//   badge clears immediately. The badge caps at 9 for visual tidiness.

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';

import { useChatStore, threadIdFor } from '@/lib/chatStore';
import { getClient } from '@/lib/mock';

const STYLIST_HANDLE = '@jess.styles';
const LAST_SEEN_KEY = 'phia-chat-lastseen-v1';

interface LastSeenMap {
  [threadId: string]: string; // ISO timestamp
}

function readLastSeen(): LastSeenMap {
  if (typeof window === 'undefined') return {};
  try {
    const raw = window.localStorage.getItem(LAST_SEEN_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as LastSeenMap;
  } catch {
    return {};
  }
}

function writeLastSeen(next: LastSeenMap): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(LAST_SEEN_KEY, JSON.stringify(next));
  } catch {
    // Ignore quota / permission errors — they shouldn't break the UI.
  }
}

export interface ClientNavTabsProps {
  clientId: string;
}

interface NavLink {
  key: string;
  href: string;
  label: string;
  match: (pathname: string) => boolean;
  badge?: number;
}

export function ClientNavTabs({ clientId }: ClientNavTabsProps) {
  const router = useRouter();
  const pathname = usePathname() || '';
  const client = getClient(clientId);
  const threadId = threadIdFor(clientId, STYLIST_HANDLE);

  const messages = useChatStore(
    (s) => s.messagesByThread[threadId] ?? EMPTY_MESSAGES,
  );

  const [lastSeenAt, setLastSeenAt] = useState<string>('');

  // Load lastSeen for this thread on mount + whenever the client changes.
  useEffect(() => {
    const map = readLastSeen();
    setLastSeenAt(map[threadId] ?? '');
  }, [threadId]);

  // If the user is actively on the chat page, mark-as-seen on every new
  // message so the badge never shows up while they're watching it.
  const onChatPage = pathname === `/client/${clientId}/chat`;
  useEffect(() => {
    if (!onChatPage) return;
    const now = new Date().toISOString();
    const map = readLastSeen();
    map[threadId] = now;
    writeLastSeen(map);
    setLastSeenAt(now);
  }, [onChatPage, threadId, messages.length]);

  const unreadCount = useMemo(() => {
    if (!lastSeenAt) {
      // First visit — only count messages newer than the last seed message
      // so the badge isn't screaming out of the gate.
      if (messages.length === 0) return 0;
      const lastIso = messages[messages.length - 1].createdAt;
      const cutoff = new Date(lastIso).getTime() - 1; // include nothing
      return messages.filter(
        (m) => m.sender === 'stylist' && new Date(m.createdAt).getTime() > cutoff,
      ).length;
    }
    const cutoff = new Date(lastSeenAt).getTime();
    return messages.filter(
      (m) => m.sender === 'stylist' && new Date(m.createdAt).getTime() > cutoff,
    ).length;
  }, [messages, lastSeenAt]);

  const links: NavLink[] = [
    {
      key: 'home',
      href: `/client/${clientId}`,
      label: 'Home',
      match: (p) => p === `/client/${clientId}`,
    },
    {
      key: 'chat',
      href: `/client/${clientId}/chat`,
      label: 'Chat',
      match: (p) => p.startsWith(`/client/${clientId}/chat`),
      badge: unreadCount,
    },
    {
      key: 'closet',
      href: `/client/${clientId}/closet`,
      label: 'Closet',
      match: (p) => p.startsWith(`/client/${clientId}/closet`),
    },
    {
      key: 'inbox',
      href: `/client/${clientId}/inbox`,
      label: 'Inbox',
      match: (p) => p.startsWith(`/client/${clientId}/inbox`),
    },
  ];

  const settingsHref = `/client/${clientId}/settings`;
  const onSettings = pathname.startsWith(settingsHref);

  const firstName = client?.name.split(' ')[0] ?? 'Guest';
  const photoUrl = client?.photoUrl;

  return (
    <header className="client-topbar">
      <div className="client-topbar-inner">
        <button
          type="button"
          className="brand"
          onClick={() => router.push(`/client/${clientId}`)}
          aria-label="phia — home"
        >
          phia
        </button>

        <nav className="nav" aria-label="Primary">
          {links.map((l) => {
            const active = l.match(pathname);
            return (
              <Link
                key={l.key}
                href={l.href}
                className={`nav-link ${active ? 'active' : ''}`}
              >
                <span>{l.label}</span>
                {l.badge && l.badge > 0 ? (
                  <span className="badge" aria-label={`${l.badge} unread`}>
                    {l.badge > 9 ? '9+' : l.badge}
                  </span>
                ) : null}
              </Link>
            );
          })}
          <Link
            key="settings"
            href={settingsHref}
            className={`nav-link nav-gear ${onSettings ? 'active' : ''}`}
            aria-label="Settings"
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.4"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <circle cx="12" cy="12" r="2.8" />
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.6 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33 1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
            </svg>
          </Link>
        </nav>

        <div className="persona">
          <div
            className="persona-avatar"
            style={photoUrl ? { backgroundImage: `url(${photoUrl})` } : undefined}
            aria-hidden="true"
          />
          <div className="persona-meta">
            <div className="persona-micro">Signed in as</div>
            <div className="persona-name">{firstName}</div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .client-topbar {
          position: sticky;
          top: 0;
          z-index: 40;
          background: rgba(245, 244, 241, 0.84);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border-bottom: 1px solid var(--line);
        }
        .client-topbar-inner {
          max-width: 1240px;
          margin: 0 auto;
          padding: 14px 28px;
          display: flex;
          align-items: center;
          gap: 28px;
        }

        .brand {
          font-family: var(--font-serif), Georgia, serif;
          font-style: italic;
          font-size: 22px;
          line-height: 1;
          letter-spacing: -0.01em;
          color: var(--ink);
          padding: 4px 2px;
        }

        .nav {
          display: flex;
          align-items: center;
          gap: 28px;
          margin-left: 8px;
        }
        .nav-link {
          position: relative;
          display: inline-flex;
          align-items: center;
          gap: 7px;
          font-size: 13.5px;
          color: var(--ink-3);
          text-decoration: none;
          padding: 14px 0;
          transition: color 0.2s ease;
        }
        .nav-link:hover {
          color: var(--ink-2);
        }
        .nav-link.active {
          color: var(--ink);
        }
        .nav-link.active::after {
          content: '';
          position: absolute;
          left: 0;
          right: 0;
          bottom: -1px;
          height: 2px;
          background: var(--accent);
          border-radius: 2px;
        }
        .nav-gear {
          color: var(--ink-3);
          padding: 12px 0;
        }
        .nav-gear:hover {
          color: var(--ink);
        }

        .badge {
          min-width: 18px;
          height: 18px;
          padding: 0 6px;
          border-radius: 999px;
          background: var(--accent);
          color: #fff;
          font-size: 10.5px;
          font-weight: 600;
          letter-spacing: 0;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          line-height: 1;
          box-shadow: 0 1px 2px rgba(217, 119, 87, 0.32);
        }

        .persona {
          margin-left: auto;
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 5px 12px 5px 5px;
          border-radius: 999px;
          background: var(--card);
          border: 1px solid var(--line);
        }
        .persona-avatar {
          width: 30px;
          height: 30px;
          border-radius: 50%;
          background: var(--bg-sub) center/cover no-repeat;
          flex-shrink: 0;
        }
        .persona-meta {
          display: flex;
          flex-direction: column;
          line-height: 1.1;
        }
        .persona-micro {
          font-size: 9.5px;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: var(--ink-4);
          font-weight: 500;
        }
        .persona-name {
          font-size: 12.5px;
          color: var(--ink);
          margin-top: 1px;
        }

        @media (max-width: 820px) {
          .client-topbar-inner {
            padding: 12px 18px;
            gap: 14px;
          }
          .nav {
            gap: 16px;
          }
          .persona-meta {
            display: none;
          }
          .persona {
            padding: 3px;
          }
        }
      `}</style>
    </header>
  );
}

const EMPTY_MESSAGES: ReturnType<typeof useChatStore.getState>['messagesByThread'][string] = [];
