// PhiaPriceLine — price stack with phia price, strike retail, savings badge, source.
// Ported from shared.jsx lines 95–109.

import { fmt } from '@/lib/utils';
import type { Garment } from '@/lib/mock';
import { SavingsBadge } from './SavingsBadge';

export interface PhiaPriceLineProps {
  garment: Garment;
  compact?: boolean;
}

export function PhiaPriceLine({ garment, compact }: PhiaPriceLineProps) {
  const { retailPrice, phia } = garment;
  return (
    <div className="col gap-4">
      <div className="row gap-8" style={{ alignItems: 'baseline' }}>
        <span className="serif" style={{ fontSize: compact ? 18 : 22 }}>{fmt(phia.lowest)}</span>
        <span className="strike" style={{ fontSize: 12 }}>{fmt(retailPrice)}</span>
        <SavingsBadge pct={phia.savings} />
      </div>
      <div className="micro" style={{ fontSize: 10 }}>
        {phia.source} · {phia.condition}
      </div>
    </div>
  );
}
