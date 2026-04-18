'use client';

// Inbox — client reactions, approvals, questions.
// Port of inbox.jsx:1–186. Thread list + conversation pane + reply composer.
// Router replaces onNav('look', { lookId }) for the thread "Open look" button
// and the in-thread look card click.

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Icon } from '@/components/Icon';
import { getClient, getGarment, getLook, lookTotals } from '@/lib/mock';
import { cx, fmt } from '@/lib/utils';

type ThreadKind = 'reaction' | 'question' | 'approved';
type Thread = {
  id: string;
  clientId: 'sarah' | 'maya';
  kind: ThreadKind;
  unread: boolean;
  time: string;
  subject: string;
  preview: string;
  lookId: string;
  pieces?: string[];
};

export default function Inbox() {
  const router = useRouter();
  const [filter, setFilter] = useState<'all' | ThreadKind>('all');
  const [active, setActive] = useState(0);

  const threads: Thread[] = [
    { id: 't1', clientId: 'sarah', kind: 'reaction', unread: true, time: '12m ago',
      subject: 'Loved 3 pieces in Rooftop engagement party',
      preview: "The Reformation slip is everything. Can we try a slingback instead of the mule?",
      lookId: 'look-sarah-1', pieces: ['g1', 'g13', 'g8'] },
    { id: 't2', clientId: 'maya', kind: 'question', unread: true, time: '1h ago',
      subject: 'Question about Joshua Tree look',
      preview: "Would the Wrangler jacket work over the cashmere? Going to be 48 at night.",
      lookId: 'look-maya-1' },
    { id: 't3', clientId: 'sarah', kind: 'approved', unread: false, time: 'Yesterday',
      subject: 'Approved: Weekend in Hudson',
      preview: "Perfect. Ordering the boots and the jean tonight. Thanks Jess!",
      lookId: 'look-sarah-3' },
    { id: 't4', clientId: 'maya', kind: 'question', unread: false, time: '2 days ago',
      subject: 'Can we see this in cream?',
      preview: "The Khaite trouser — any chance phia has it in the off-white colorway?",
      lookId: 'look-maya-2' },
    { id: 't5', clientId: 'sarah', kind: 'reaction', unread: false, time: '3 days ago',
      subject: 'Not for me: Soho editorial',
      preview: "The oxford feels too oversized for the shoot. Love everything else.",
      lookId: 'look-sarah-2' },
  ];

  const filtered = filter === 'all' ? threads : threads.filter(t => t.kind === filter);
  const cur = filtered[active] || filtered[0];
  const client = cur && getClient(cur.clientId);
  const look = cur && getLook(cur.lookId);

  return (
    <div className="screen inbox" data-screen-label="Inbox">
      <div className="inbox-shell">
        <div className="inbox-head">
          <div>
            <div className="micro">From your clients</div>
            <h1 className="serif-italic inbox-title">Inbox</h1>
          </div>
          <div className="row gap-8">
            <button className={cx('pill', filter === 'all' && 'active')} onClick={() => { setFilter('all'); setActive(0); }}>All <span style={{ color: 'var(--ink-4)' }}>· {threads.length}</span></button>
            <button className={cx('pill', filter === 'reaction' && 'active')} onClick={() => { setFilter('reaction'); setActive(0); }}>Reactions</button>
            <button className={cx('pill', filter === 'question' && 'active')} onClick={() => { setFilter('question'); setActive(0); }}>Questions</button>
            <button className={cx('pill', filter === 'approved' && 'active')} onClick={() => { setFilter('approved'); setActive(0); }}>Approved</button>
          </div>
        </div>

        <div className="inbox-grid">
          <aside className="inbox-list">
            {filtered.map((t, i) => {
              const c = getClient(t.clientId);
              if (!c) return null;
              return (
                <button key={t.id} className={cx('ib-row', i === active && 'on')} onClick={() => setActive(i)}>
                  <div className="avatar" style={{ backgroundImage: `url(${c.photoUrl})`, width: 36, height: 36 }} />
                  <div style={{ flex: 1, textAlign: 'left', minWidth: 0 }}>
                    <div className="row" style={{ justifyContent: 'space-between', alignItems: 'baseline' }}>
                      <span style={{ fontSize: 13, fontWeight: t.unread ? 500 : 400 }}>{c.name.split(' ')[0]}</span>
                      <span className="micro" style={{ fontSize: 9.5 }}>{t.time}</span>
                    </div>
                    <div className="serif-italic" style={{ fontSize: 14, lineHeight: 1.3, marginTop: 2, color: 'var(--ink)' }}>{t.subject}</div>
                    <div style={{ fontSize: 12, color: 'var(--ink-3)', marginTop: 3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.preview}</div>
                    <div className="row gap-6" style={{ marginTop: 6 }}>
                      <span className={cx('ib-kind', `ib-${t.kind}`)}>{t.kind}</span>
                      {t.unread && <span className="ib-dot" />}
                    </div>
                  </div>
                </button>
              );
            })}
          </aside>

          {cur && client && (
            <div className="inbox-thread">
              <div className="it-head">
                <div className="row gap-12">
                  <div className="avatar" style={{ backgroundImage: `url(${client.photoUrl})`, width: 44, height: 44 }} />
                  <div>
                    <div className="serif-italic" style={{ fontSize: 22, lineHeight: 1.1 }}>{cur.subject}</div>
                    <div className="micro" style={{ marginTop: 4 }}>{client.name} · {cur.time}</div>
                  </div>
                </div>
                <div className="row gap-8">
                  {look && <button className="btn btn-ghost" onClick={() => router.push(`/looks/${cur.lookId}`)}>Open look</button>}
                  <button className="btn btn-ghost">Archive</button>
                </div>
              </div>

              <div className="it-body">
                <div className="msg msg-them">
                  <div className="avatar" style={{ backgroundImage: `url(${client.photoUrl})`, width: 32, height: 32 }} />
                  <div className="msg-bubble">
                    <div style={{ fontSize: 14, color: 'var(--ink)', lineHeight: 1.55 }}>{cur.preview}</div>
                    <div className="micro" style={{ marginTop: 8, fontSize: 10 }}>{cur.time}</div>
                  </div>
                </div>

                {cur.pieces && (
                  <div className="msg-pieces">
                    <div className="micro" style={{ marginBottom: 10 }}>Pieces she loved</div>
                    <div className="row gap-10">
                      {cur.pieces.map(pid => {
                        const g = getGarment(pid);
                        if (!g) return null;
                        return (
                          <div key={pid} className="mp">
                            <div className="mp-img" style={{ backgroundImage: `url(${g.imageUrl})` }}>
                              <div className="mp-heart"><Icon.heart /></div>
                            </div>
                            <div className="micro" style={{ marginTop: 6 }}>{g.brand}</div>
                            <div style={{ fontSize: 12, lineHeight: 1.2, marginTop: 1 }}>{g.name}</div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {look && (
                  <div className="msg-look" onClick={() => router.push(`/looks/${cur.lookId}`)}>
                    <div className="ml-img" style={{ backgroundImage: `url(${look.coverUrl})` }} />
                    <div className="col" style={{ flex: 1 }}>
                      <div className="micro">Look in thread</div>
                      <div className="serif-italic" style={{ fontSize: 18, marginTop: 2 }}>{look.occasion}</div>
                      <div className="micro" style={{ marginTop: 4, fontSize: 10 }}>{look.garmentIds.length} pieces · {fmt(lookTotals(look).phia)} with phia</div>
                    </div>
                    <Icon.arrow />
                  </div>
                )}
              </div>

              <div className="it-compose">
                <textarea placeholder={`Reply to ${client.name.split(' ')[0]}…`} />
                <div className="row" style={{ justifyContent: 'space-between', alignItems: 'center', marginTop: 12 }}>
                  <div className="row gap-8">
                    <button className="pill"><Icon.spark /> Propose a swap</button>
                    <button className="pill"><Icon.plus /> New look from this</button>
                  </div>
                  <button className="btn btn-primary">Send reply</button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        .inbox-shell { max-width: 1440px; margin: 0 auto; padding: 40px 32px 60px; }
        .inbox-head { display: flex; align-items: flex-end; justify-content: space-between; margin-bottom: 28px; gap: 20px; flex-wrap: wrap; }
        .inbox-title { font-size: 56px; line-height: 1; margin: 10px 0 0; letter-spacing: -0.02em; }

        .inbox-grid { display: grid; grid-template-columns: 380px 1fr; gap: 24px; align-items: flex-start; }
        .inbox-list { background: var(--card); border-radius: var(--radius-lg); padding: 6px; box-shadow: var(--shadow-sm); max-height: calc(100vh - 240px); overflow-y: auto; }
        .ib-row { display: flex; gap: 12px; padding: 12px; width: 100%; border-radius: var(--radius); align-items: flex-start; }
        .ib-row:hover { background: var(--bg); }
        .ib-row.on { background: var(--bg-sub); }
        .ib-kind { font-size: 9.5px; letter-spacing: .08em; text-transform: uppercase; padding: 2px 7px; border-radius: 999px; }
        .ib-reaction { background: var(--accent-soft); color: var(--accent); }
        .ib-question { background: #EEEAE3; color: var(--ink-2); }
        .ib-approved { background: var(--sage-soft); color: var(--sage); }
        .ib-dot { width: 6px; height: 6px; border-radius: 50%; background: var(--accent); }

        .inbox-thread { background: var(--card); border-radius: var(--radius-lg); box-shadow: var(--shadow-sm); overflow: hidden; display: flex; flex-direction: column; min-height: 600px; }
        .it-head { display: flex; justify-content: space-between; align-items: center; padding: 20px 26px; border-bottom: 1px solid var(--line); gap: 16px; }
        .it-body { padding: 26px; flex: 1; display: flex; flex-direction: column; gap: 20px; }

        .msg-them { display: flex; gap: 12px; align-items: flex-start; max-width: 560px; }
        .msg-bubble { background: var(--bg); padding: 14px 18px; border-radius: 18px; border-top-left-radius: 6px; }

        .msg-pieces { }
        .mp { width: 110px; }
        .mp-img { aspect-ratio: 3/4; background: var(--bg-sub) center/cover no-repeat; border-radius: 10px; position: relative; }
        .mp-heart { position: absolute; top: 8px; right: 8px; width: 24px; height: 24px; border-radius: 50%; background: var(--accent); color: #fff; display: flex; align-items: center; justify-content: center; }

        .msg-look { display: flex; align-items: center; gap: 14px; padding: 14px; background: var(--bg); border-radius: var(--radius); cursor: pointer; color: var(--ink-2); }
        .msg-look:hover { background: var(--bg-sub); color: var(--ink); }
        .ml-img { width: 56px; height: 72px; background: var(--bg-sub) center/cover no-repeat; border-radius: 8px; }

        .it-compose { padding: 20px 26px 22px; border-top: 1px solid var(--line); background: var(--bg); }
        .it-compose textarea { width: 100%; border: 1px solid var(--line); border-radius: var(--radius); padding: 12px 14px; font-size: 13.5px; background: var(--card); outline: none; min-height: 72px; resize: vertical; }

        @media (max-width: 1100px) { .inbox-grid { grid-template-columns: 1fr; } }
      `}</style>
    </div>
  );
}
