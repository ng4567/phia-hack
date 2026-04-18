'use client';

// Client detail — the stylist's client page with looks, closet, notes tabs.
// Direct port of client.jsx:1–123. Route params replace the prop-drilled
// clientId; router replaces the source's onNav prop.

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { cx, fmt } from '@/lib/utils';
import { getClient, getLooksFor, lookTotals } from '@/lib/mock';
import type { Look } from '@/lib/mock';
import { Icon } from '@/components/Icon';
import { LookCard } from '@/components/client/LookCard';
import { NewLookTile } from '@/components/client/NewLookTile';
import { ClosetEmpty } from '@/components/client/ClosetEmpty';
import { NotesView } from '@/components/client/NotesView';

export default function ClientDetail() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const client = getClient(id);
  const looks = getLooksFor(id);
  const [tab, setTab] = useState('looks');

  if (!client) return null;

  // Aggregate saved across all looks
  const totals = looks.reduce<{ retail: number; phia: number }>((acc, l: Look) => {
    const t = lookTotals(l);
    acc.retail += t.retail; acc.phia += t.phia;
    return acc;
  }, { retail: 0, phia: 0 });

  return (
    <div className="screen client-detail" data-screen-label={`02 Client · ${client.name}`}>
      <div className="page-inner">
        <div className="crumb">
          <span onClick={() => router.push('/dashboard')} style={{ cursor: 'pointer' }}>Clients</span>
          <span style={{ color: 'var(--ink-4)' }}>/</span>
          <span>{client.name}</span>
        </div>

        {/* Client header */}
        <section className="cd-header">
          <div className="cd-photo" style={{ backgroundImage: `url(${client.photoUrl})` }} />
          <div className="cd-info">
            <div className="micro">{client.location}</div>
            <h1 className="serif-italic cd-name">{client.name}</h1>
            <p className="cd-notes">{client.notes}</p>

            <div className="cd-specs">
              <div className="spec">
                <div className="micro">Top</div>
                <div className="serif" style={{ fontSize: 22 }}>{client.sizing.top}</div>
              </div>
              <div className="spec">
                <div className="micro">Bottom</div>
                <div className="serif" style={{ fontSize: 22 }}>{client.sizing.bottom}</div>
              </div>
              <div className="spec">
                <div className="micro">Shoe</div>
                <div className="serif" style={{ fontSize: 22 }}>{client.sizing.shoe}</div>
              </div>
              <div className="spec">
                <div className="micro">Saved via phia</div>
                <div className="serif" style={{ fontSize: 22, color: 'var(--sage)' }}>{fmt(totals.retail - totals.phia)}</div>
              </div>
            </div>

            <div className="row gap-12" style={{ marginTop: 24 }}>
              <button className="btn btn-primary" onClick={() => router.push(`/clients/${id}/new-look`)}>
                <Icon.plus /> New look
              </button>
              <button className="btn btn-ghost">
                <Icon.share /> View client link
              </button>
            </div>
          </div>
        </section>

        {/* Tabs */}
        <div className="cd-tabs">
          <button className={cx('cd-tab', tab === 'looks' && 'on')} onClick={() => setTab('looks')}>
            Looks <span className="count">{looks.length}</span>
          </button>
          <button className={cx('cd-tab', tab === 'closet' && 'on')} onClick={() => setTab('closet')}>
            Closet <span className="count">14</span>
          </button>
          <button className={cx('cd-tab', tab === 'notes' && 'on')} onClick={() => setTab('notes')}>
            Notes
          </button>
          <div style={{ flex: 1 }} />
          <div className="row gap-8">
            <button className="pill"><Icon.filter /> Filter</button>
            <button className="pill"><Icon.grid /> View</button>
          </div>
        </div>

        {tab === 'looks' && (
          <div className="looks-grid">
            <NewLookTile onClick={() => router.push(`/clients/${id}/new-look`)} />
            {looks.map((l) => (
              <LookCard key={l.id} look={l} client={client} onClick={() => router.push(`/looks/${l.id}`)} />
            ))}
          </div>
        )}

        {tab === 'closet' && <ClosetEmpty />}
        {tab === 'notes' && <NotesView client={client} />}
      </div>

      <style jsx>{`
        .page-inner { max-width: 1440px; margin: 0 auto; padding: 28px 32px 80px; }

        .crumb { display: flex; gap: 10px; font-size: 12.5px; color: var(--ink-3); margin-bottom: 24px; }

        .cd-header { display: grid; grid-template-columns: 380px 1fr; gap: 48px; margin-bottom: 44px; }
        .cd-photo { aspect-ratio: 4/5; background: var(--bg-sub) center/cover no-repeat; border-radius: var(--radius-lg); }
        .cd-name { font-size: 68px; line-height: 1; margin: 10px 0 20px; letter-spacing: -0.02em; }
        .cd-notes { font-size: 15px; line-height: 1.6; color: var(--ink-2); max-width: 540px; margin: 0; }

        .cd-specs { display: grid; grid-template-columns: repeat(4, max-content); gap: 48px; margin-top: 32px; padding-top: 24px; border-top: 1px solid var(--line); }
        .spec { }

        .cd-tabs { display: flex; align-items: center; gap: 4px; border-bottom: 1px solid var(--line); margin-bottom: 24px; padding-bottom: 0; }
        .cd-tab { padding: 12px 16px 14px; font-size: 13.5px; color: var(--ink-3); position: relative; }
        .cd-tab .count { margin-left: 6px; font-size: 11px; color: var(--ink-4); }
        .cd-tab.on { color: var(--ink); }
        .cd-tab.on::after { content: ''; position: absolute; left: 16px; right: 16px; bottom: -1px; height: 1.5px; background: var(--ink); }

        .looks-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 24px; }
        @media (max-width: 1200px) {
          .cd-header { grid-template-columns: 1fr; gap: 28px; }
          .cd-photo { max-width: 420px; }
          .cd-name { font-size: 56px; }
          .looks-grid { grid-template-columns: repeat(3, 1fr); }
        }
      `}</style>
    </div>
  );
}
