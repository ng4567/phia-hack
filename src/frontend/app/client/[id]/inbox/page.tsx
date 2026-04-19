'use client';

// Customer inbox — editorial gallery of looks Jess has shared.
//
// Draws from MOCK.looks[clientId] and renders SharedLookCard tiles in a
// 2-column grid on desktop. Intentionally not densely packed — it should
// feel like a lookbook.

import { useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';

import { ClientNavTabs } from '@/components/client/ClientNavTabs';
import { SharedLookCard } from '@/components/client/SharedLookCard';
import { getClient, getLooksFor } from '@/lib/mock';

export default function ClientInboxPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const client = getClient(id);
  const looks = getLooksFor(id);

  const [lead, ...rest] = useMemo(() => looks, [looks]);

  if (!client) return null;

  return (
    <>
      <ClientNavTabs clientId={id} />

      <main className="screen inbox-page" data-screen-label="Client · Inbox">
        <div className="inbox-shell">
          {/* Header */}
          <section className="inbox-hero">
            <div className="hero-eyebrow">
              <span className="micro">Your inbox</span>
              <span className="hero-count">
                {looks.length} look{looks.length === 1 ? '' : 's'} from Jess
              </span>
            </div>
            <h1 className="serif-italic inbox-title">
              Everything Jess pulled for you.
            </h1>
            <p className="inbox-sub">
              Tap any look to see the try-on, the prices via Phia, and the full
              chain of pieces.
            </p>
          </section>

          {looks.length === 0 ? (
            <section className="inbox-empty">
              <div className="serif-italic empty-title">No looks yet.</div>
              <p className="empty-body">
                When Jess shares the first one, it will land here before it lands
                anywhere else.
              </p>
              <button
                type="button"
                className="empty-cta"
                onClick={() => router.push(`/client/${id}/chat`)}
              >
                Message Jess
              </button>
            </section>
          ) : (
            <>
              {/* Lead tile — oversized for the newest look */}
              {lead && (
                <section className="lead">
                  <div className="lead-meta">
                    <div className="micro">Latest</div>
                    <div className="lead-occasion serif-italic">{lead.occasion}</div>
                    <div className="lead-location">{lead.location ?? 'No location set'}</div>
                    <div className="lead-stamp">{lead.createdAt}</div>
                    <button
                      type="button"
                      className="lead-cta"
                      onClick={() => router.push(`/looks/${lead.id}/view`)}
                    >
                      <span>Open this look</span>
                      <span className="arrow" aria-hidden="true">→</span>
                    </button>
                  </div>
                  <button
                    type="button"
                    className="lead-image"
                    style={{ backgroundImage: `url(${lead.coverUrl})` }}
                    onClick={() => router.push(`/looks/${lead.id}/view`)}
                    aria-label={`Open ${lead.occasion}`}
                  >
                    <span className="lead-chip">
                      <span className="lead-dot" />
                      New from Jess
                    </span>
                  </button>
                </section>
              )}

              {/* Remaining looks grid */}
              {rest.length > 0 && (
                <section className="grid-section">
                  <div className="section-head">
                    <div className="section-title-block">
                      <div className="micro">Earlier</div>
                      <h2 className="serif section-title">The rest of your looks</h2>
                    </div>
                  </div>
                  <div className="grid stagger">
                    {rest.map((l) => (
                      <SharedLookCard key={l.id} lookId={l.id} />
                    ))}
                  </div>
                </section>
              )}
            </>
          )}
        </div>

        <style jsx>{`
          .inbox-page {
            min-height: calc(100vh - 60px);
            padding-bottom: 80px;
          }
          .inbox-shell {
            max-width: 1200px;
            margin: 0 auto;
            padding: 36px 32px 0;
            display: flex;
            flex-direction: column;
            gap: 56px;
          }

          .inbox-hero {
            display: flex;
            flex-direction: column;
            gap: 10px;
            max-width: 620px;
          }
          .hero-eyebrow {
            display: flex;
            align-items: center;
            gap: 14px;
          }
          .hero-count {
            font-size: 10.5px;
            letter-spacing: 0.14em;
            text-transform: uppercase;
            color: var(--ink-4);
            font-weight: 500;
          }
          .inbox-title {
            font-size: 54px;
            line-height: 1.05;
            letter-spacing: -0.02em;
            color: var(--ink);
            margin: 4px 0 0;
          }
          .inbox-sub {
            font-size: 14px;
            color: var(--ink-3);
            line-height: 1.55;
            margin: 4px 0 0;
            max-width: 440px;
          }

          .lead {
            display: grid;
            grid-template-columns: 1fr 1.35fr;
            gap: 28px;
            align-items: stretch;
            padding: 32px 36px;
            background: var(--card);
            border: 1px solid var(--line);
            border-radius: var(--radius-xl);
            box-shadow: var(--shadow-sm);
            min-height: 400px;
          }
          .lead-meta {
            display: flex;
            flex-direction: column;
            justify-content: center;
            gap: 10px;
          }
          .lead-occasion {
            font-size: 38px;
            line-height: 1.08;
            letter-spacing: -0.015em;
            color: var(--ink);
            margin-top: 4px;
          }
          .lead-location {
            font-size: 14px;
            color: var(--ink-2);
            margin-top: 4px;
          }
          .lead-stamp {
            font-size: 10.5px;
            letter-spacing: 0.12em;
            text-transform: uppercase;
            color: var(--ink-4);
            font-weight: 500;
            margin-top: 6px;
          }
          .lead-cta {
            margin-top: 20px;
            align-self: flex-start;
            display: inline-flex;
            align-items: center;
            gap: 10px;
            padding: 11px 10px 11px 20px;
            border-radius: 999px;
            background: var(--ink);
            color: var(--card);
            font-size: 13px;
            font-weight: 500;
            transition: transform 0.2s cubic-bezier(0.2, 0.7, 0.2, 1), background 0.2s ease;
          }
          .lead-cta:hover {
            background: #000;
            transform: translateY(-1px);
          }
          .lead-cta .arrow {
            width: 26px;
            height: 26px;
            border-radius: 999px;
            background: rgba(255, 255, 255, 0.14);
            display: inline-flex;
            align-items: center;
            justify-content: center;
            font-size: 12px;
            transition: transform 0.3s cubic-bezier(0.2, 0.7, 0.2, 1);
          }
          .lead-cta:hover .arrow {
            transform: translateX(3px);
          }

          .lead-image {
            position: relative;
            background: var(--bg-sub) center/cover no-repeat;
            border-radius: var(--radius-lg);
            min-height: 380px;
            padding: 0;
            overflow: hidden;
            transition: transform 0.4s cubic-bezier(0.2, 0.7, 0.2, 1);
          }
          .lead-image::after {
            content: '';
            position: absolute;
            inset: 0;
            background: linear-gradient(180deg, rgba(26, 24, 22, 0) 60%, rgba(26, 24, 22, 0.24) 100%);
            pointer-events: none;
          }
          .lead-image:hover {
            transform: scale(1.01);
          }
          .lead-chip {
            position: absolute;
            top: 16px;
            left: 16px;
            display: inline-flex;
            align-items: center;
            gap: 7px;
            padding: 6px 12px;
            background: rgba(255, 255, 255, 0.94);
            color: var(--ink);
            font-size: 10.5px;
            letter-spacing: 0.1em;
            text-transform: uppercase;
            font-weight: 500;
            border-radius: 999px;
            backdrop-filter: blur(8px);
            -webkit-backdrop-filter: blur(8px);
            z-index: 1;
          }
          .lead-dot {
            width: 6px;
            height: 6px;
            border-radius: 50%;
            background: var(--accent);
            box-shadow: 0 0 0 3px rgba(217, 119, 87, 0.24);
          }

          .grid-section {
            display: flex;
            flex-direction: column;
            gap: 18px;
          }
          .section-head {
            display: flex;
            align-items: flex-end;
            justify-content: space-between;
          }
          .section-title-block {
            display: flex;
            flex-direction: column;
            gap: 4px;
          }
          .section-title {
            font-size: 26px;
            line-height: 1.05;
            letter-spacing: -0.01em;
            color: var(--ink);
            margin: 0;
          }
          .grid {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 22px;
          }

          .inbox-empty {
            padding: 64px 40px;
            background: var(--card);
            border: 1px dashed var(--line-2);
            border-radius: var(--radius-xl);
            display: flex;
            flex-direction: column;
            gap: 10px;
            align-items: flex-start;
          }
          .empty-title {
            font-size: 28px;
            line-height: 1.15;
            color: var(--ink);
          }
          .empty-body {
            font-size: 13.5px;
            color: var(--ink-3);
            max-width: 420px;
            line-height: 1.55;
            margin: 0;
          }
          .empty-cta {
            margin-top: 10px;
            padding: 11px 22px;
            border-radius: 999px;
            background: var(--accent);
            color: #fff;
            font-size: 12.5px;
            font-weight: 500;
            transition: transform 0.2s cubic-bezier(0.2, 0.7, 0.2, 1),
              background 0.2s ease;
          }
          .empty-cta:hover {
            background: #C96945;
            transform: translateY(-1px);
          }

          @media (max-width: 980px) {
            .lead {
              grid-template-columns: 1fr;
              padding: 24px;
            }
            .lead-image {
              min-height: 360px;
              order: -1;
            }
            .grid {
              grid-template-columns: repeat(2, 1fr);
            }
          }
          @media (max-width: 640px) {
            .inbox-shell {
              padding: 28px 18px 0;
              gap: 40px;
            }
            .inbox-title {
              font-size: 40px;
            }
            .lead-occasion {
              font-size: 28px;
            }
            .grid {
              grid-template-columns: 1fr;
            }
          }
        `}</style>
      </main>
    </>
  );
}
