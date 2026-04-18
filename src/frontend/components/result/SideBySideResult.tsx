'use client';

// SideBySideResult — photo + per-item aside layout. Default variant.
// Direct port of result.jsx:48–121. Count-ups preserved.

import { fmt, useCountUp } from '@/lib/utils';
import type { Client, Garment, Look, LookTotals } from '@/lib/mock';
import { Icon } from '@/components/Icon';
import { ItemRow } from './ItemRow';

export interface SideBySideResultProps {
  look: Look;
  client: Client;
  totals: LookTotals;
  hoverIdx: number | null;
  setHoverIdx: (i: number | null) => void;
  onItem: (g: Garment) => void;
  onSwap: (g: Garment) => void;
}

export function SideBySideResult({
  look,
  client,
  totals,
  hoverIdx,
  setHoverIdx,
  onItem,
  onSwap,
}: SideBySideResultProps) {
  // Count-ups — source declares all three but only uses aRetail inline.
  // We animate all three for the task-spec intent ("count-up totals animate
  // on load"); other two read the animated values here.
  const aPhia = useCountUp(totals.phia, { trigger: look.id });
  const aRetail = useCountUp(totals.retail, { trigger: look.id });
  const aSave = useCountUp(totals.savings, { trigger: look.id, duration: 1100 });

  return (
    <div className="res-grid">
      <div className="res-left">
        <div className="micro">{look.createdAt} · for {look.location || client.name}</div>
        <h1 className="serif-italic res-title">{look.occasion}</h1>

        <div className="res-photo-wrap">
          <div
            className="res-photo reveal-mask"
            style={{ backgroundImage: `url(${look.tryOnImageUrl || look.coverUrl})` }}
          >
            <div className="res-chip">
              <span className="dot" /> Try-on · {client.name.split(' ')[0]}
            </div>
          </div>
        </div>

        <div className="res-summary scale-in">
          <div className="col">
            <div className="micro">Retail total</div>
            <div className="serif strike" style={{ fontSize: 32 }}>${aRetail.toLocaleString()}</div>
          </div>
          <div style={{ flex: 1, height: 1, background: 'var(--line)', margin: '0 16px' }} />
          <div className="col">
            <div className="micro">With phia</div>
            <div className="serif" style={{ fontSize: 48, lineHeight: 1, color: 'var(--accent)' }}>{fmt(aPhia)}</div>
          </div>
          <div style={{ flex: 1, height: 1, background: 'var(--line)', margin: '0 16px' }} />
          <div className="col">
            <div className="micro">Saved {totals.savingsPct}%</div>
            <div className="serif" style={{ fontSize: 32, color: 'var(--sage)' }}>{fmt(aSave)}</div>
          </div>
        </div>
      </div>

      <aside className="res-right">
        <div className="micro" style={{ marginBottom: 18 }}>The look · {totals.garments.length} pieces</div>
        <div className="res-items">
          {totals.garments.map((g, i) => (
            <ItemRow
              key={g.id}
              g={g}
              i={i}
              onHover={setHoverIdx}
              hovered={hoverIdx === i}
              onItem={onItem}
              onSwap={onSwap}
            />
          ))}
        </div>
        <div className="res-nudge">
          <Icon.spark />
          <div>
            <div style={{ fontSize: 13, color: 'var(--ink)' }}>Swap any piece</div>
            <div className="micro" style={{ color: 'var(--ink-3)', marginTop: 3 }}>Phia re-prices the full look in real time.</div>
          </div>
        </div>
      </aside>

      <style jsx>{`
        .res-grid { display: grid; grid-template-columns: 1fr 420px; gap: 48px; align-items: flex-start; }
        .res-title { font-size: 64px; line-height: 1; margin: 8px 0 28px; letter-spacing: -0.02em; }
        .res-photo-wrap { position: relative; }
        .res-photo { aspect-ratio: 4/5; border-radius: var(--radius-xl);
          background: var(--bg-sub) center/cover no-repeat; position: relative; box-shadow: var(--shadow-md); }
        .res-chip { position: absolute; top: 18px; left: 18px; display: inline-flex; align-items: center; gap: 8px;
          padding: 7px 14px; border-radius: 999px; background: rgba(255,255,255,0.92); backdrop-filter: blur(8px); font-size: 11.5px; color: var(--ink); }
        .res-chip .dot { width: 6px; height: 6px; border-radius: 50%; background: var(--accent); box-shadow: 0 0 0 3px rgba(217,119,87,0.18); }

        .res-summary { display: flex; align-items: center; margin-top: 28px; padding: 22px 28px; background: var(--card); border-radius: var(--radius-lg); box-shadow: var(--shadow-sm); }

        .res-right { position: sticky; top: 96px; background: var(--card); border-radius: var(--radius-lg); padding: 26px 28px; box-shadow: var(--shadow-sm); }
        .res-items { display: flex; flex-direction: column; gap: 2px; }

        .res-nudge { margin-top: 22px; padding: 16px; display: flex; gap: 12px; align-items: flex-start;
          background: var(--bg); border-radius: var(--radius); color: var(--ink-2); cursor: pointer; }
        .res-nudge:hover { background: var(--accent-soft); color: var(--ink); }
      `}</style>
    </div>
  );
}
