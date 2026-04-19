'use client';

// Client detail — the stylist's single-pane-of-glass for one client.
//
// Layout is a two-column split on desktop:
//   LEFT  (≈60%, min 0)  — existing header, notes, looks grid preserved
//                          intact; new GmailClosetSection + PreferencesPanel
//                          appended below.
//   RIGHT (420px fixed)  — sticky ChatRail, UpcomingEventsList, and a
//                          ConnectedDotsCompact row.
//
// Below 1100px the grid stacks and the right rail flows under the left.
// The route now also:
//   - marks the client's thread as "seen" on mount (drives the inbox
//     read state via `useInboxStore`), and
//   - scrolls the chat rail into view when the URL has a `#chat` hash
//     (the inbox rows deep-link with that hash).

import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';

import { cx, fmt } from '@/lib/utils';
import { getClient, getLooksFor, lookTotals } from '@/lib/mock';
import type { Look } from '@/lib/mock';
import { useChatStore, threadIdFor } from '@/lib/chatStore';
import { useInboxStore } from '@/lib/inboxStore';
import { MOCK } from '@/lib/mock';
import { Icon } from '@/components/Icon';
import { LookCard } from '@/components/client/LookCard';
import { NewLookTile } from '@/components/client/NewLookTile';
import { NotesView } from '@/components/client/NotesView';
import { ChatRail } from '@/components/stylist/ChatRail';
import { GmailClosetSection } from '@/components/stylist/GmailClosetSection';
import { PreferencesPanel } from '@/components/stylist/PreferencesPanel';
import { UpcomingEventsList } from '@/components/stylist/UpcomingEventsList';
import { ConnectedDotsCompact } from '@/components/stylist/ConnectedDotsCompact';

// Stable empty arrays for zustand selector reference equality.
const EMPTY_MESSAGES: ReturnType<typeof useChatStore.getState>['messagesByThread'][string] =
  [];

export default function ClientDetail() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const client = getClient(id);
  const looks = getLooksFor(id);
  const [tab, setTab] = useState<'looks' | 'notes'>('looks');

  // Thread + inbox wiring. Pulled above the early return so the hooks
  // stay in a stable order — getClient may return undefined during an
  // edge-case route transition but the page guards below.
  const threadId = threadIdFor(id ?? '', MOCK.stylist.handle);
  const threadMessages = useChatStore(
    (s) => s.messagesByThread[threadId] ?? EMPTY_MESSAGES,
  );
  const markSeen = useInboxStore((s) => s.markSeen);

  // Mark-as-read on mount. Using the *latest* message timestamp (rather
  // than Date.now()) means the inbox unread counter clears exactly to
  // the state of the thread at the moment of open — no risk of a later
  // write being accidentally considered "seen" if the stylist just
  // flicked through.
  useEffect(() => {
    if (!id) return;
    const last = threadMessages[threadMessages.length - 1];
    markSeen(id, last?.createdAt);
    // Intentionally also runs when new messages arrive while the page
    // is already open — keeps the inbox indicator quiet as long as the
    // stylist is looking at this client.
  }, [id, threadMessages, markSeen]);

  // Scroll the chat rail into view when arriving with `#chat`.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (window.location.hash !== '#chat') return;
    const el = document.getElementById('chat');
    if (el) {
      // rAF so the layout has settled before the scroll.
      requestAnimationFrame(() => {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    }
  }, []);

  // Aggregate saved across all looks (preserved from the prior version).
  const totals = useMemo(
    () =>
      looks.reduce<{ retail: number; phia: number }>(
        (acc, l: Look) => {
          const t = lookTotals(l);
          acc.retail += t.retail;
          acc.phia += t.phia;
          return acc;
        },
        { retail: 0, phia: 0 },
      ),
    [looks],
  );

  if (!client) return null;

  return (
    <div
      className="screen client-detail"
      data-screen-label={`02 Client · ${client.name}`}
    >
      <div className="page-inner">
        <div className="crumb">
          <span
            onClick={() => router.push('/dashboard')}
            style={{ cursor: 'pointer' }}
          >
            Clients
          </span>
          <span style={{ color: 'var(--ink-4)' }}>/</span>
          <span>{client.name}</span>
        </div>

        <div className="cd-grid">
          {/* ───── LEFT column ────────────────────────────────────── */}
          <div className="cd-left">
            {/* Header — preserved from the original */}
            <section className="cd-header">
              <div
                className="cd-photo"
                style={{ backgroundImage: `url(${client.photoUrl})` }}
              />
              <div className="cd-info">
                <div className="micro">{client.location}</div>
                <h1 className="serif-italic cd-name">{client.name}</h1>
                <p className="cd-notes">{client.notes}</p>

                <div className="cd-specs">
                  <div className="spec">
                    <div className="micro">Top</div>
                    <div className="serif" style={{ fontSize: 22 }}>
                      {client.sizing.top}
                    </div>
                  </div>
                  <div className="spec">
                    <div className="micro">Bottom</div>
                    <div className="serif" style={{ fontSize: 22 }}>
                      {client.sizing.bottom}
                    </div>
                  </div>
                  <div className="spec">
                    <div className="micro">Shoe</div>
                    <div className="serif" style={{ fontSize: 22 }}>
                      {client.sizing.shoe}
                    </div>
                  </div>
                  <div className="spec">
                    <div className="micro">Saved via phia</div>
                    <div
                      className="serif"
                      style={{ fontSize: 22, color: 'var(--sage)' }}
                    >
                      {fmt(totals.retail - totals.phia)}
                    </div>
                  </div>
                </div>

                <div className="row gap-12" style={{ marginTop: 24 }}>
                  <button
                    className="btn btn-primary"
                    onClick={() => router.push(`/clients/${id}/new-look`)}
                  >
                    <Icon.plus /> New look
                  </button>
                  <button className="btn btn-ghost">
                    <Icon.share /> View client link
                  </button>
                </div>
              </div>
            </section>

            {/* Tabs — reduced to looks + notes. The Closet tab is
                replaced by the GmailClosetSection below, which surfaces
                real Gmail-derived garments rather than an empty state. */}
            <div className="cd-tabs">
              <button
                className={cx('cd-tab', tab === 'looks' && 'on')}
                onClick={() => setTab('looks')}
              >
                Looks <span className="count">{looks.length}</span>
              </button>
              <button
                className={cx('cd-tab', tab === 'notes' && 'on')}
                onClick={() => setTab('notes')}
              >
                Notes
              </button>
              <div style={{ flex: 1 }} />
              <div className="row gap-8">
                <button className="pill">
                  <Icon.filter /> Filter
                </button>
                <button className="pill">
                  <Icon.grid /> View
                </button>
              </div>
            </div>

            {tab === 'looks' && (
              <div className="looks-grid">
                <NewLookTile
                  onClick={() => router.push(`/clients/${id}/new-look`)}
                />
                {looks.map((l) => (
                  <LookCard
                    key={l.id}
                    look={l}
                    client={client}
                    onClick={() => router.push(`/looks/${l.id}`)}
                  />
                ))}
              </div>
            )}

            {tab === 'notes' && <NotesView client={client} />}

            {/* Gmail-derived closet + preferences, added for Wave 2. */}
            <div className="cd-extras">
              <GmailClosetSection clientId={client.id} />
              <PreferencesPanel clientId={client.id} />
            </div>
          </div>

          {/* ───── RIGHT rail ─────────────────────────────────────── */}
          <div className="cd-right">
            <div className="cd-right-sticky">
              <ChatRail client={client} />
              <UpcomingEventsList clientId={client.id} />
              <section className="cd-connected">
                <div className="micro">Connected</div>
                <div className="cd-connected-body">
                  <ConnectedDotsCompact />
                </div>
              </section>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .page-inner {
          max-width: 1440px;
          margin: 0 auto;
          padding: 28px 32px 96px;
        }

        .crumb {
          display: flex;
          gap: 10px;
          font-size: 12.5px;
          color: var(--ink-3);
          margin-bottom: 24px;
        }

        /* ── Split grid ───────────────────────────────────────────── */
        .cd-grid {
          display: grid;
          grid-template-columns: minmax(0, 1fr) 420px;
          gap: 32px;
          align-items: start;
        }
        .cd-left { min-width: 0; }
        .cd-right { min-width: 0; }
        .cd-right-sticky {
          position: sticky;
          top: 96px;
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        @media (max-width: 1100px) {
          .cd-grid { grid-template-columns: 1fr; gap: 24px; }
          .cd-right-sticky { position: static; top: auto; }
        }

        /* ── Header (preserved) ────────────────────────────────────── */
        .cd-header {
          display: grid;
          grid-template-columns: 340px 1fr;
          gap: 40px;
          margin-bottom: 38px;
        }
        .cd-photo {
          aspect-ratio: 4/5;
          background: var(--bg-sub) center/cover no-repeat;
          border-radius: var(--radius-lg);
        }
        .cd-name {
          font-size: 62px;
          line-height: 1;
          margin: 10px 0 20px;
          letter-spacing: -0.02em;
        }
        .cd-notes {
          font-size: 15px;
          line-height: 1.6;
          color: var(--ink-2);
          max-width: 540px;
          margin: 0;
        }

        .cd-specs {
          display: grid;
          grid-template-columns: repeat(4, max-content);
          gap: 40px;
          margin-top: 30px;
          padding-top: 22px;
          border-top: 1px solid var(--line);
        }

        /* ── Tabs (trimmed) ────────────────────────────────────────── */
        .cd-tabs {
          display: flex;
          align-items: center;
          gap: 4px;
          border-bottom: 1px solid var(--line);
          margin-bottom: 24px;
          padding-bottom: 0;
        }
        .cd-tab {
          padding: 12px 16px 14px;
          font-size: 13.5px;
          color: var(--ink-3);
          position: relative;
        }
        .cd-tab .count {
          margin-left: 6px;
          font-size: 11px;
          color: var(--ink-4);
        }
        .cd-tab.on { color: var(--ink); }
        .cd-tab.on::after {
          content: '';
          position: absolute;
          left: 16px;
          right: 16px;
          bottom: -1px;
          height: 1.5px;
          background: var(--ink);
        }

        .looks-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 22px;
        }
        @media (max-width: 1280px) {
          .looks-grid { grid-template-columns: repeat(2, 1fr); }
        }
        @media (max-width: 640px) {
          .looks-grid { grid-template-columns: 1fr; }
        }

        /* ── Extras below the looks grid ───────────────────────────── */
        .cd-extras {
          display: flex;
          flex-direction: column;
          gap: 24px;
          margin-top: 40px;
        }

        /* ── Connected micro-card in the rail ──────────────────────── */
        .cd-connected {
          background: var(--card);
          border-radius: var(--radius);
          padding: 16px 20px 18px;
          box-shadow: var(--shadow-sm);
        }
        .cd-connected-body { margin-top: 10px; }

        @media (max-width: 1200px) {
          .cd-header {
            grid-template-columns: 1fr;
            gap: 24px;
          }
          .cd-photo { max-width: 360px; }
          .cd-name { font-size: 54px; }
        }
      `}</style>
    </div>
  );
}
