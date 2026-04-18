'use client';

// SwapPanel — modal listing alternative garments for a given piece.
//
// STUB: this component is referenced by result.jsx line 41 but was never
// defined in the mockup source. The trigger (`onSwap`) was also never wired
// on the source ItemRow, so this panel is effectively unreachable in the
// current port. Included for TS/runtime safety.

import { fmt } from '@/lib/utils';
import { swapsFor } from '@/lib/mock';
import type { Garment } from '@/lib/mock';
import { Icon } from '@/components/Icon';
import { SavingsBadge } from '@/components/SavingsBadge';

export interface SwapPanelProps {
  garment: Garment;
  onClose: () => void;
}

export function SwapPanel({ garment, onClose }: SwapPanelProps) {
  const alternatives = swapsFor(garment);

  return (
    <div className="sp-back" onClick={onClose}>
      <aside className="sp" onClick={(e) => e.stopPropagation()}>
        <button className="sp-close" onClick={onClose}><Icon.close /></button>
        <div className="serif-italic sp-title">Swap this piece</div>
        <div className="micro" style={{ color: 'var(--ink-3)', marginTop: 4 }}>
          Alternatives in the same category — phia re-prices the look live.
        </div>

        <div className="sp-current">
          <div className="sp-current-img" style={{ backgroundImage: `url(${garment.imageUrl})` }} />
          <div style={{ flex: 1 }}>
            <div className="micro">{garment.brand}</div>
            <div style={{ fontSize: 14, lineHeight: 1.3, marginTop: 2 }}>{garment.name}</div>
            <div className="row gap-8" style={{ alignItems: 'baseline', marginTop: 6 }}>
              <span style={{ fontSize: 14, fontWeight: 500 }}>{fmt(garment.phia.lowest)}</span>
              <span className="strike" style={{ fontSize: 11 }}>{fmt(garment.retailPrice)}</span>
            </div>
          </div>
        </div>

        <div className="micro" style={{ marginTop: 22, marginBottom: 12 }}>You could try</div>
        <div className="sp-list">
          {alternatives.map((g) => (
            <div key={g.id} className="sp-alt">
              <div className="sp-alt-img" style={{ backgroundImage: `url(${g.imageUrl})` }} />
              <div style={{ flex: 1 }}>
                <div className="micro">{g.brand}</div>
                <div style={{ fontSize: 13, lineHeight: 1.3, marginTop: 2 }}>{g.name}</div>
                <div className="row gap-8" style={{ alignItems: 'baseline', marginTop: 6 }}>
                  <span style={{ fontSize: 13, fontWeight: 500 }}>{fmt(g.phia.lowest)}</span>
                  <span className="strike" style={{ fontSize: 11 }}>{fmt(g.retailPrice)}</span>
                </div>
              </div>
              <SavingsBadge pct={g.phia.savings} />
            </div>
          ))}
        </div>
      </aside>
      <style jsx>{`
        .sp-back { position: fixed; inset: 0; background: rgba(26,24,22,0.35); backdrop-filter: blur(4px);
          z-index: 120; animation: fadeUp .2s ease; display: flex; justify-content: flex-end; }
        .sp { width: 440px; max-height: 85vh; margin: auto 32px; background: var(--card);
          border-radius: var(--radius-lg); box-shadow: var(--shadow-lg); padding: 28px 30px 24px;
          position: relative; overflow-y: auto; }
        .sp-close { position: absolute; top: 14px; right: 14px; width: 32px; height: 32px; border-radius: 50%;
          color: var(--ink-3); display: flex; align-items: center; justify-content: center; }
        .sp-close:hover { background: var(--bg); color: var(--ink); }
        .sp-title { font-size: 30px; line-height: 1.1; letter-spacing: -0.01em; }
        .sp-current { display: flex; gap: 14px; padding: 14px; background: var(--bg); border-radius: var(--radius); margin-top: 22px; align-items: center; }
        .sp-current-img { width: 64px; aspect-ratio: 3/4; background: var(--bg-sub) center/cover no-repeat; border-radius: 8px; flex-shrink: 0; }
        .sp-list { display: flex; flex-direction: column; gap: 2px; }
        .sp-alt { display: flex; gap: 14px; padding: 12px 4px; border-bottom: 1px solid var(--line); align-items: center; cursor: pointer; }
        .sp-alt:last-child { border-bottom: none; }
        .sp-alt:hover { background: var(--bg); border-radius: 8px; padding: 12px 10px; }
        .sp-alt-img { width: 56px; aspect-ratio: 3/4; background: var(--bg-sub) center/cover no-repeat; border-radius: 6px; flex-shrink: 0; }
      `}</style>
    </div>
  );
}
