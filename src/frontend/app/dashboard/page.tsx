'use client';

// Dashboard — the stylist's client list.
// Port of dashboard.jsx:1–124. Hero + clients section (editorial or grid)
// + recent-looks strip. Layout variant switched via ?layout=editorial|grid
// (default 'editorial'). Router replaces the source's onNav prop.

import { Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Icon } from '@/components/Icon';
import { MOCK, getClient } from '@/lib/mock';
import { ClientCard } from '@/components/dashboard/ClientCard';
import { ClientEditorialCard } from '@/components/dashboard/ClientEditorialCard';
import { NewClientCard } from '@/components/dashboard/NewClientCard';
import { RecentLookCard } from '@/components/dashboard/RecentLookCard';

export default function Dashboard() {
  return (
    <Suspense fallback={null}>
      <DashboardInner />
    </Suspense>
  );
}

function DashboardInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const layoutParam = searchParams.get('layout');
  const isEditorial = layoutParam !== 'grid';

  const { clients, stylist } = MOCK;
  const sarah = getClient('sarah');
  const maya = getClient('maya');

  return (
    <div className="screen dashboard" data-screen-label="01 Dashboard">
      <div className="page-inner">
        {/* Hero intro */}
        <section className="hero">
          <div className="hero-left">
            <div className="micro">Stylist portfolio</div>
            <h1 className="serif-italic hero-title">
              Good morning,<br/>
              <span style={{ color: 'var(--accent)' }}>{stylist.name.split(' ')[0]}</span>.
            </h1>
            <p className="hero-sub">
              Two clients active this week. Phoebe&apos;s rooftop party look is ready to share.
            </p>
            <div className="row gap-12" style={{ marginTop: 20 }}>
              <button className="btn btn-primary">
                <Icon.plus /> New client
              </button>
              <button className="btn btn-ghost">
                Import from closet
              </button>
            </div>
          </div>
          <div className="hero-right">
            <div className="stat-grid">
              <div className="stat">
                <div className="micro">Looks delivered</div>
                <div className="serif stat-num">148</div>
                <div className="stat-delta">+12 this month</div>
              </div>
              <div className="stat">
                <div className="micro">Saved for clients</div>
                <div className="serif stat-num">$38,420</div>
                <div className="stat-delta" style={{ color: 'var(--sage)' }}>via phia</div>
              </div>
              <div className="stat">
                <div className="micro">Avg. savings</div>
                <div className="serif stat-num">62%</div>
                <div className="stat-delta">off retail</div>
              </div>
            </div>
          </div>
        </section>

        {/* Clients */}
        <section className="clients-section">
          <div className="section-head">
            <h2 className="serif section-title">Clients</h2>
            <div className="row gap-8">
              <button className="pill active">All</button>
              <button className="pill">Active</button>
              <button className="pill">Waiting on approval</button>
              <button className="pill">Archived</button>
            </div>
          </div>

          {isEditorial ? (
            <div className="clients-editorial">
              {clients.map((c, i) => (
                <ClientEditorialCard key={c.id} client={c} index={i} onClick={() => router.push(`/clients/${c.id}`)} />
              ))}
            </div>
          ) : (
            <div className="clients-grid">
              {clients.map((c) => (
                <ClientCard key={c.id} client={c} onClick={() => router.push(`/clients/${c.id}`)} />
              ))}
              <NewClientCard />
            </div>
          )}
        </section>

        {/* Recent activity strip */}
        <section style={{ marginTop: 48 }}>
          <div className="section-head">
            <h2 className="serif section-title">Recent looks</h2>
            <a className="micro" style={{ cursor: 'pointer' }}>View all →</a>
          </div>
          <div className="recent-strip">
            {sarah && MOCK.looks.sarah.slice(0, 3).map((l) => (
              <RecentLookCard key={l.id} look={l} client={sarah} onClick={() => router.push(`/looks/${l.id}`)} />
            ))}
            {maya && MOCK.looks.maya.slice(0, 2).map((l) => (
              <RecentLookCard key={l.id} look={l} client={maya} onClick={() => router.push(`/looks/${l.id}`)} />
            ))}
          </div>
        </section>
      </div>

      <style jsx>{`
        .page-inner { max-width: 1440px; margin: 0 auto; padding: 40px 32px 80px; }

        .hero { display: grid; grid-template-columns: 1.2fr 1fr; gap: 56px; align-items: end; margin-bottom: 64px; }
        .hero-title { font-size: 72px; line-height: 1; margin: 14px 0 18px; letter-spacing: -0.02em; }
        .hero-sub { font-size: 15px; color: var(--ink-2); max-width: 360px; line-height: 1.55; margin: 0; }

        .stat-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 2px; background: var(--line); border-radius: var(--radius-lg); overflow: hidden; }
        .stat { background: var(--card); padding: 22px 24px; }
        .stat-num { font-size: 36px; line-height: 1; margin-top: 8px; letter-spacing: -0.01em; }
        .stat-delta { font-size: 11px; color: var(--ink-3); margin-top: 8px; }

        .section-head { display: flex; align-items: baseline; justify-content: space-between; margin-bottom: 22px; }
        .section-title { font-size: 30px; line-height: 1; letter-spacing: -0.01em; margin: 0; }

        .clients-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; }
        .clients-editorial { display: grid; grid-template-columns: 1fr 1fr; gap: 32px; }

        .recent-strip { display: grid; grid-template-columns: repeat(5, 1fr); gap: 16px; }

        @media (max-width: 1200px) {
          .hero { grid-template-columns: 1fr; gap: 40px; }
          .hero-title { font-size: 60px; }
          .clients-grid, .clients-editorial { grid-template-columns: 1fr 1fr; }
          .recent-strip { grid-template-columns: repeat(3, 1fr); }
        }
      `}</style>
    </div>
  );
}
