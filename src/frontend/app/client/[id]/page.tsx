'use client';

// Customer home dashboard — anchor screen from spec §2.
//
// Sections, top to bottom:
//   1. Greeting ("Good evening, Phoebe." in serif italic) + sub-line
//   2. Connected services row (Gmail · Calendar · Outlook)
//   3. Split row: Next event card (left, wider) · Latest-message-from-Jess
//      preview (right)
//   4. Closet preview grid (first 6 garments) + "see all" link
//   5. Recent looks strip (first 2 looks for this client) + "see all" link
//
// Reads:
//   - Client display via getClient(id).
//   - Calendar + Outlook fixtures to feed NextEventCard.
//   - Gmail fixture's first 6 garments for the closet preview.
//   - useChatStore to surface the most recent stylist message.
//
// Background stays var(--bg); cards sit on var(--card) with --shadow-sm.
// Respects the same ?reset=1 convention — if hit, we clear the three demo
// localStorage keys and reload so judges can re-run the flow.

import { Suspense, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useParams, useRouter, useSearchParams } from 'next/navigation';

import { getClient, getLooksFor } from '@/lib/mock';
import { useChatStore, threadIdFor } from '@/lib/chatStore';
import type { CalendarEvent, ClosetGarment } from '@/lib/mock/types';
import phoebeGmail from '@/lib/mock/client-phoebe-gmail.json';
import phoebeCalendar from '@/lib/mock/client-phoebe-calendar.json';
import phoebeOutlook from '@/lib/mock/client-phoebe-outlook.json';
import sophiaGmail from '@/lib/mock/client-sophia-gmail.json';
import sophiaCalendar from '@/lib/mock/client-sophia-calendar.json';
import sophiaOutlook from '@/lib/mock/client-sophia-outlook.json';

import { ClientNavTabs } from '@/components/client/ClientNavTabs';
import { ConnectedServicesRow } from '@/components/client/ConnectedServicesRow';
import { NextEventCard } from '@/components/client/NextEventCard';
import { ClosetItemCard } from '@/components/client/ClosetItemCard';
import { SharedLookCard } from '@/components/client/SharedLookCard';

const STYLIST_HANDLE = '@jess.styles';

interface GmailShape {
  garments: ClosetGarment[];
}
interface EventsShape {
  events: CalendarEvent[];
}

const GMAIL: Record<string, GmailShape> = {
  sarah: phoebeGmail as GmailShape,
  maya: sophiaGmail as GmailShape,
};
const CALENDAR: Record<string, EventsShape> = {
  sarah: phoebeCalendar as EventsShape,
  maya: sophiaCalendar as EventsShape,
};
const OUTLOOK: Record<string, EventsShape> = {
  sarah: phoebeOutlook as EventsShape,
  maya: sophiaOutlook as EventsShape,
};

function greeting(now: Date): string {
  const h = now.getHours();
  if (h < 5) return 'Still up,';
  if (h < 12) return 'Good morning,';
  if (h < 17) return 'Good afternoon,';
  if (h < 21) return 'Good evening,';
  return 'Still up,';
}

export default function ClientHome() {
  return (
    <Suspense fallback={null}>
      <ClientHomeInner />
    </Suspense>
  );
}

function ClientHomeInner() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const shouldReset = searchParams.get('reset') === '1';

  // Demo reset hook — clears the three localStorage keys named in the spec.
  useEffect(() => {
    if (!shouldReset) return;
    if (typeof window === 'undefined') return;
    try {
      window.localStorage.removeItem('phia-chat-v1');
      window.localStorage.removeItem('phia-connected-v1');
      window.localStorage.removeItem('phia-ui-v1');
      window.localStorage.removeItem('phia-chat-lastseen-v1');
    } catch {
      // Swallow — reset is best-effort.
    }
    // Scrub the ?reset flag and reload cleanly.
    window.location.replace(`/client/${id}`);
  }, [shouldReset, id]);

  const client = getClient(id);
  const threadId = threadIdFor(id, STYLIST_HANDLE);
  const messages = useChatStore(
    (s) => s.messagesByThread[threadId] ?? EMPTY_MESSAGES,
  );

  const gmail = GMAIL[id];
  const cal = CALENDAR[id];
  const out = OUTLOOK[id];

  const closetPreview = (gmail?.garments ?? []).slice(0, 6);

  // Blend both event sources, sort by start ascending.
  const blendedEvents = useMemo<CalendarEvent[]>(() => {
    const all: CalendarEvent[] = [
      ...(cal?.events ?? []),
      ...(out?.events ?? []),
    ];
    return all.sort(
      (a, b) => new Date(a.start).getTime() - new Date(b.start).getTime(),
    );
  }, [cal, out]);

  const latestStylistMsg = useMemo(() => {
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i].sender === 'stylist') return messages[i];
    }
    return null;
  }, [messages]);

  const latestLooks = getLooksFor(id).slice(0, 2);

  if (!client) {
    return null;
  }

  const firstName = client.name.split(' ')[0];
  const greetingLine = greeting(new Date());

  return (
    <>
      <ClientNavTabs clientId={id} />

      <main className="screen client-home" data-screen-label={`Client · ${client.name}`}>
        <div className="home-shell">
          {/* ── Greeting ── */}
          <section className="hero">
            <div className="hero-eyebrow">
              <span className="micro">Wednesday · April {new Date().getDate()}</span>
              <span className="hero-weather">58° · clearing</span>
            </div>
            <h1 className="hero-title">
              <span className="serif">{greetingLine}</span>
              <span className="serif-italic hero-name">{firstName}.</span>
            </h1>
            <p className="hero-sub">
              Three events on your calendar this week. Jess already pulled a first pass
              for the rooftop — it&rsquo;s in your inbox.
            </p>
          </section>

          {/* ── Connected services ── */}
          <section className="section">
            <div className="section-head">
              <div className="section-title-block">
                <div className="micro">Connected</div>
                <h2 className="serif section-title">Your signals</h2>
              </div>
              <Link className="see-all" href={`/client/${id}/settings`}>
                Manage <span aria-hidden="true">→</span>
              </Link>
            </div>
            <ConnectedServicesRow clientId={id} />
          </section>

          {/* ── Event + latest chat preview ── */}
          <section className="split">
            <NextEventCard clientId={id} events={blendedEvents} />

            <div className="msg-preview">
              <div className="msg-head">
                <div
                  className="msg-avatar"
                  style={{ backgroundImage: `url(/clients/phoebe.png)` }}
                  aria-hidden="true"
                />
                <div className="msg-meta">
                  <div className="micro">Latest from Jess</div>
                  <div className="msg-name">Jess Martell</div>
                </div>
              </div>

              <div className="msg-body">
                {latestStylistMsg ? (
                  <p className="serif-italic msg-text">
                    &ldquo;{truncate(latestStylistMsg.body, 180)}&rdquo;
                  </p>
                ) : (
                  <p className="serif-italic msg-text muted">
                    &ldquo;I&rsquo;ll have a first pass over by tonight — talk soon.&rdquo;
                  </p>
                )}
                <div className="msg-stamp">
                  {latestStylistMsg
                    ? formatRelative(latestStylistMsg.createdAt)
                    : 'Sent earlier this week'}
                </div>
              </div>

              <button
                type="button"
                className="msg-cta"
                onClick={() => router.push(`/client/${id}/chat`)}
              >
                <span>Open chat</span>
                <span className="arrow" aria-hidden="true">→</span>
              </button>
            </div>
          </section>

          {/* ── Closet preview ── */}
          <section className="section">
            <div className="section-head">
              <div className="section-title-block">
                <div className="micro">Your closet · via Gmail</div>
                <h2 className="serif section-title">What you already own</h2>
              </div>
              <Link className="see-all" href={`/client/${id}/closet`}>
                See all {gmail?.garments?.length ?? 0} <span aria-hidden="true">→</span>
              </Link>
            </div>
            {closetPreview.length > 0 ? (
              <div className="closet-preview stagger">
                {closetPreview.map((g) => (
                  <ClosetItemCard
                    key={g.id}
                    garment={g}
                    onClick={() => router.push(`/client/${id}/closet`)}
                  />
                ))}
              </div>
            ) : (
              <div className="empty-card">
                <div className="serif-italic empty-title">Nothing pulled from Gmail yet.</div>
                <div className="empty-body">
                  Reconnect Gmail from Settings to let Jess see what you already own.
                </div>
              </div>
            )}
          </section>

          {/* ── Recent looks ── */}
          <section className="section">
            <div className="section-head">
              <div className="section-title-block">
                <div className="micro">Recent from Jess</div>
                <h2 className="serif section-title">Looks for you</h2>
              </div>
              <Link className="see-all" href={`/client/${id}/inbox`}>
                Open inbox <span aria-hidden="true">→</span>
              </Link>
            </div>
            {latestLooks.length > 0 ? (
              <div className="looks-strip stagger">
                {latestLooks.map((l) => (
                  <SharedLookCard key={l.id} lookId={l.id} />
                ))}
              </div>
            ) : (
              <div className="empty-card">
                <div className="serif-italic empty-title">No looks yet.</div>
                <div className="empty-body">
                  When Jess shares your first look, it will land here first.
                </div>
              </div>
            )}
          </section>
        </div>

        <style jsx>{`
          .client-home {
            min-height: calc(100vh - 60px);
            padding-bottom: 80px;
          }
          .home-shell {
            max-width: 1200px;
            margin: 0 auto;
            padding: 36px 32px 0;
            display: flex;
            flex-direction: column;
            gap: 56px;
          }

          .hero {
            display: flex;
            flex-direction: column;
            gap: 14px;
          }
          .hero-eyebrow {
            display: flex;
            align-items: center;
            gap: 14px;
            margin-bottom: 4px;
          }
          .hero-weather {
            font-size: 10.5px;
            letter-spacing: 0.14em;
            text-transform: uppercase;
            color: var(--ink-4);
            font-weight: 500;
          }
          .hero-title {
            font-size: 62px;
            line-height: 1;
            margin: 4px 0 0;
            letter-spacing: -0.02em;
            color: var(--ink);
            display: flex;
            flex-direction: column;
            gap: 2px;
          }
          .hero-title .serif {
            color: var(--ink-2);
          }
          .hero-name {
            color: var(--accent);
          }
          .hero-sub {
            font-size: 15px;
            color: var(--ink-3);
            max-width: 520px;
            line-height: 1.55;
            margin: 6px 0 0;
          }

          .section {
            display: flex;
            flex-direction: column;
            gap: 18px;
          }
          .section-head {
            display: flex;
            align-items: flex-end;
            justify-content: space-between;
            gap: 24px;
          }
          .section-title-block {
            display: flex;
            flex-direction: column;
            gap: 4px;
          }
          .section-title {
            font-size: 28px;
            line-height: 1.05;
            letter-spacing: -0.01em;
            margin: 0;
            color: var(--ink);
          }
          .see-all {
            font-size: 11.5px;
            letter-spacing: 0.08em;
            text-transform: uppercase;
            color: var(--ink-3);
            text-decoration: none;
            font-weight: 500;
            transition: color 0.2s ease;
          }
          .see-all:hover {
            color: var(--accent);
          }

          .split {
            display: grid;
            grid-template-columns: 1.4fr 1fr;
            gap: 18px;
          }

          .msg-preview {
            background: var(--card);
            border: 1px solid var(--line);
            border-radius: var(--radius-xl);
            padding: 24px 26px 22px;
            box-shadow: var(--shadow-sm);
            display: flex;
            flex-direction: column;
            gap: 18px;
          }
          .msg-head {
            display: flex;
            align-items: center;
            gap: 12px;
          }
          .msg-avatar {
            width: 40px;
            height: 40px;
            border-radius: 50%;
            background: var(--bg-sub) center/cover no-repeat;
            flex-shrink: 0;
            background-image: url('https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200&h=200&fit=crop&crop=faces');
          }
          .msg-meta {
            display: flex;
            flex-direction: column;
            gap: 1px;
          }
          .msg-name {
            font-size: 13.5px;
            color: var(--ink);
          }
          .msg-body {
            display: flex;
            flex-direction: column;
            gap: 10px;
            flex: 1;
          }
          .msg-text {
            font-size: 20px;
            line-height: 1.35;
            color: var(--ink);
            margin: 0;
            letter-spacing: -0.005em;
          }
          .msg-text.muted {
            color: var(--ink-3);
          }
          .msg-stamp {
            font-size: 10.5px;
            letter-spacing: 0.1em;
            text-transform: uppercase;
            color: var(--ink-4);
            font-weight: 500;
          }
          .msg-cta {
            margin-top: auto;
            align-self: flex-start;
            display: inline-flex;
            align-items: center;
            gap: 8px;
            padding: 9px 16px;
            border-radius: 999px;
            background: var(--card);
            border: 1px solid var(--line-2);
            color: var(--ink);
            font-size: 12.5px;
            font-weight: 500;
            transition: transform 0.2s cubic-bezier(0.2, 0.7, 0.2, 1),
              background 0.2s ease,
              border-color 0.2s ease;
          }
          .msg-cta:hover {
            background: var(--bg);
            border-color: rgba(26, 24, 22, 0.24);
            transform: translateY(-1px);
          }
          .msg-cta .arrow {
            color: var(--accent);
            transition: transform 0.25s cubic-bezier(0.2, 0.7, 0.2, 1);
          }
          .msg-cta:hover .arrow {
            transform: translateX(3px);
          }

          .closet-preview {
            display: grid;
            grid-template-columns: repeat(6, 1fr);
            gap: 14px;
          }

          .looks-strip {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 18px;
          }

          .empty-card {
            padding: 36px 32px;
            background: var(--card);
            border: 1px dashed var(--line-2);
            border-radius: var(--radius-lg);
            display: flex;
            flex-direction: column;
            gap: 8px;
            align-items: flex-start;
          }
          .empty-title {
            font-size: 22px;
            line-height: 1.2;
            color: var(--ink);
          }
          .empty-body {
            font-size: 13px;
            color: var(--ink-3);
            max-width: 420px;
            line-height: 1.5;
          }

          @media (max-width: 980px) {
            .split {
              grid-template-columns: 1fr;
            }
            .closet-preview {
              grid-template-columns: repeat(3, 1fr);
            }
          }
          @media (max-width: 640px) {
            .home-shell {
              padding: 28px 18px 0;
              gap: 44px;
            }
            .hero-title {
              font-size: 46px;
            }
            .closet-preview {
              grid-template-columns: repeat(2, 1fr);
            }
            .looks-strip {
              grid-template-columns: 1fr;
            }
          }
        `}</style>
      </main>
    </>
  );
}

function truncate(text: string, n: number): string {
  if (text.length <= n) return text;
  return `${text.slice(0, n - 1).trimEnd()}…`;
}

function formatRelative(iso: string): string {
  try {
    const then = new Date(iso).getTime();
    const now = Date.now();
    const diff = now - then;
    const mins = Math.round(diff / 60_000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.round(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.round(hrs / 24);
    if (days < 7) return `${days}d ago`;
    return new Date(iso).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return '';
  }
}

const EMPTY_MESSAGES: ReturnType<typeof useChatStore.getState>['messagesByThread'][string] = [];
