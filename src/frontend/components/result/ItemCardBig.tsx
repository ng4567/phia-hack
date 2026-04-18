// ItemCardBig — large card used in the stacked-layout piece grid.
// Direct port of result.jsx:185–204.

import { fmt } from '@/lib/utils';
import type { Garment } from '@/lib/mock';
import { SavingsBadge } from '@/components/SavingsBadge';

export interface ItemCardBigProps {
  g: Garment;
}

export function ItemCardBig({ g }: ItemCardBigProps) {
  return (
    <div className="icb">
      <div className="icb-img" style={{ backgroundImage: `url(${g.imageUrl})` }} />
      <div style={{ padding: '12px 4px 4px' }}>
        <div className="micro">{g.brand}</div>
        <div style={{ fontSize: 13, lineHeight: 1.3, margin: '3px 0 8px' }}>{g.name}</div>
        <div className="row gap-8" style={{ alignItems: 'baseline' }}>
          <span style={{ fontSize: 14, fontWeight: 500 }}>{fmt(g.phia.lowest)}</span>
          <span className="strike" style={{ fontSize: 11 }}>{fmt(g.retailPrice)}</span>
        </div>
        <div className="micro" style={{ fontSize: 9.5, marginTop: 4 }}>{g.phia.source} · {g.phia.condition}</div>
        <div style={{ marginTop: 8 }}><SavingsBadge pct={g.phia.savings} /></div>
      </div>
      <style jsx>{`
        .icb-img { aspect-ratio: 3/4; background: var(--bg-sub) center/cover no-repeat; border-radius: var(--radius); }
      `}</style>
    </div>
  );
}
