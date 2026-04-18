'use client';

// Client View — Sarah's perspective when Jess shares a look.
// Direct port of clientview.jsx:1–162. TopBarFrame already hides the
// stylist <TopBar /> (and chat bubble) on /looks/[id]/view; this screen
// renders its own lighter .cv-top bar. Router replaces the source's onNav.

import { useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { MOCK, getLook, getClient, lookTotals } from '@/lib/mock';
import { fmt, cx } from '@/lib/utils';
import { Icon } from '@/components/Icon';

export default function ClientView() {
  const router = useRouter();
  const { id: lookId } = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const generatedTryOnImageUrl = searchParams.get('tryOnImageUrl');

  const look = getLook(lookId);
  const [reactions, setReactions] = useState<Record<string, 'love' | null>>({});
  const [note, setNote] = useState('');

  function toggle(id: string) {
    setReactions((r) => ({ ...r, [id]: r[id] === 'love' ? null : 'love' }));
  }

  if (!look) return null;
  const resolvedLook = generatedTryOnImageUrl
    ? { ...look, tryOnImageUrl: generatedTryOnImageUrl }
    : look;
  const client = getClient(look.clientId);
  if (!client) return null;
  const totals = lookTotals(resolvedLook);

  return (
    <div className="screen cv" data-screen-label="05 Client view">
      {/* Client-facing top bar (lighter, different from stylist nav) */}
      <div className="cv-top">
        <div className="cv-top-inner">
          <div className="wordmark" style={{ fontSize: 24 }}>phia</div>
          <div className="micro" style={{ marginTop: 6, color: 'var(--ink-4)' }}>for you</div>
          <div style={{ flex: 1 }} />
          <button
            className="btn btn-ghost"
            onClick={() => router.push(
              `/looks/${lookId}${generatedTryOnImageUrl ? `?tryOnImageUrl=${encodeURIComponent(generatedTryOnImageUrl)}` : ''}`,
            )}
          >
            <Icon.back /> Back to stylist view
          </button>
        </div>
      </div>

      <div className="cv-shell">
        <div className="cv-intro">
          <div className="cv-stylist">
            <div className="avatar" style={{ width: 40, height: 40, backgroundImage: `url(${MOCK.stylist.photoUrl})` }} />
            <div>
              <div className="micro">From {MOCK.stylist.name}</div>
              <div style={{ fontSize: 14, color: 'var(--ink-2)', marginTop: 2 }}>Here&apos;s your look for the rooftop, {client.name.split(' ')[0]}.</div>
            </div>
          </div>
          <h1 className="serif-italic cv-title">{resolvedLook.occasion}</h1>
          <div className="micro" style={{ color: 'var(--ink-3)' }}>{resolvedLook.location} · {totals.garments.length} pieces · saved {fmt(totals.savings)}</div>
        </div>

        <div className="cv-grid">
          <div className="cv-photo-wrap">
            <div className="cv-photo" style={{ backgroundImage: `url(${resolvedLook.tryOnImageUrl || resolvedLook.coverUrl})` }}>
              <div className="cv-badge">
                <span className="micro">You, in this look</span>
              </div>
            </div>
            <div className="cv-react">
              <button className="cv-react-btn on">
                <Icon.heart /> Love it
              </button>
              <button className="cv-react-btn">Not for me</button>
              <button className="cv-react-btn">Ask Jess a question</button>
            </div>
          </div>

          <div className="cv-items">
            <div className="micro" style={{ marginBottom: 14 }}>Each piece · phia&apos;s lowest</div>
            {totals.garments.map((g) => (
              <div key={g.id} className="cvi">
                <div className="cvi-img" style={{ backgroundImage: `url(${g.imageUrl})` }} />
                <div className="cvi-info">
                  <div className="micro">{g.brand}</div>
                  <div style={{ fontSize: 14, marginTop: 3 }}>{g.name}</div>
                  <div className="row gap-8" style={{ marginTop: 8, alignItems: 'baseline' }}>
                    <span style={{ fontSize: 16, fontWeight: 500 }}>{fmt(g.phia.lowest)}</span>
                    <span className="strike" style={{ fontSize: 12 }}>{fmt(g.retailPrice)}</span>
                  </div>
                  <div className="micro" style={{ fontSize: 10, marginTop: 4 }}>{g.phia.source} · {g.phia.condition}</div>
                </div>
                <div className="cvi-actions">
                  <button
                    className={cx('cvi-love', reactions[g.id] === 'love' && 'on')}
                    onClick={() => toggle(g.id)}
                    title="Love this piece"
                  ><Icon.heart /></button>
                  <button className="btn btn-primary cvi-buy">Buy</button>
                </div>
              </div>
            ))}

            <div className="cv-note">
              <div className="micro" style={{ marginBottom: 8 }}>Note back to Jess</div>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Anything you'd want swapped? Quicker pickups on the top? Different shoe?"
              />
              <div className="row" style={{ justifyContent: 'space-between', alignItems: 'center', marginTop: 12 }}>
                <div className="micro" style={{ color: 'var(--ink-4)' }}>Delivered Apr 16 · you saw it Apr 18</div>
                <button className="btn btn-primary">Send</button>
              </div>
            </div>
          </div>
        </div>

        <div className="cv-footer">
          <div className="col" style={{ gap: 6 }}>
            <div className="micro">Phia priced every piece</div>
            <div className="serif-italic" style={{ fontSize: 22 }}>Across 40,000+ retail and resale sites.</div>
          </div>
          <div className="row gap-24">
            <div className="col"><div className="micro">Retail</div><div className="serif strike" style={{ fontSize: 24 }}>{fmt(totals.retail)}</div></div>
            <div className="col"><div className="micro">You pay</div><div className="serif" style={{ fontSize: 28, color: 'var(--accent)' }}>{fmt(totals.phia)}</div></div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .cv { background: var(--bg); min-height: 100vh; }
        .cv-top { background: var(--card); border-bottom: 1px solid var(--line); }
        .cv-top-inner { max-width: 1200px; margin: 0 auto; padding: 16px 32px; display: flex; align-items: center; gap: 14px; }

        .cv-shell { max-width: 1200px; margin: 0 auto; padding: 40px 32px 80px; }

        .cv-intro { margin-bottom: 36px; }
        .cv-stylist { display: flex; gap: 12px; align-items: center; }
        .cv-title { font-size: 72px; line-height: 1; margin: 20px 0 10px; letter-spacing: -0.02em; }

        .cv-grid { display: grid; grid-template-columns: 1fr 440px; gap: 44px; align-items: flex-start; }
        .cv-photo { aspect-ratio: 4/5; background: var(--bg-sub) center/cover no-repeat; border-radius: var(--radius-xl); position: relative; box-shadow: var(--shadow-md); }
        .cv-badge { position: absolute; bottom: 18px; left: 18px; background: rgba(255,255,255,0.92); padding: 8px 14px; border-radius: 999px; backdrop-filter: blur(8px); }
        .cv-react { display: flex; gap: 8px; margin-top: 16px; flex-wrap: wrap; }
        .cv-react-btn {
          padding: 10px 18px; border-radius: 999px; background: var(--card); border: 1px solid var(--line); font-size: 13px; display: inline-flex; align-items: center; gap: 7px;
        }
        .cv-react-btn.on { background: var(--accent-soft); color: var(--accent); border-color: transparent; }

        .cv-items { background: var(--card); border-radius: var(--radius-lg); padding: 24px 26px; box-shadow: var(--shadow-sm); }
        .cvi { display: grid; grid-template-columns: 68px 1fr auto; gap: 14px; padding: 14px 0; border-bottom: 1px solid var(--line); align-items: center; }
        .cvi:last-of-type { border-bottom: none; }
        .cvi-img { aspect-ratio: 3/4; background: var(--bg-sub) center/cover no-repeat; border-radius: 8px; }
        .cvi-actions { display: flex; gap: 6px; align-items: center; }
        .cvi-love { width: 36px; height: 36px; border-radius: 50%; background: var(--bg); color: var(--ink-3); display: flex; align-items: center; justify-content: center; }
        .cvi-love.on { background: var(--accent-soft); color: var(--accent); }
        .cvi-buy { padding: 7px 16px; font-size: 12px; }

        .cv-note { margin-top: 20px; padding-top: 20px; border-top: 1px solid var(--line); }
        .cv-note textarea {
          width: 100%; border: 1px solid var(--line); border-radius: var(--radius); padding: 12px 14px;
          font-size: 13.5px; color: var(--ink); background: var(--bg); resize: vertical; min-height: 60px; outline: none;
        }
        .cv-note textarea:focus { border-color: var(--ink-3); }

        .cv-footer {
          margin-top: 48px; padding: 28px 32px;
          background: var(--card); border-radius: var(--radius-lg);
          display: flex; justify-content: space-between; align-items: center;
          box-shadow: var(--shadow-sm);
        }

        @media (max-width: 1100px) {
          .cv-grid { grid-template-columns: 1fr; }
          .cv-title { font-size: 56px; }
        }
      `}</style>
    </div>
  );
}
