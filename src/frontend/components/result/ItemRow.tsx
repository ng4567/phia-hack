// ItemRow — one garment row in the side-by-side look summary aside.
// Direct port of result.jsx:160–183.
//
// NOTE: the source wires onSwap through to ItemRow's props but never
// actually calls it anywhere in the row — so we accept it silently for
// signature parity and don't render a trigger. This matches source behavior
// (the SwapPanel is effectively unreachable in the mockup).

import { cx, fmt } from '@/lib/utils';
import type { Garment } from '@/lib/mock';
import { SavingsBadge } from '@/components/SavingsBadge';

export interface ItemRowProps {
  g: Garment;
  i: number;
  onHover: (i: number | null) => void;
  hovered: boolean;
  onItem?: (g: Garment) => void;
  onSwap?: (g: Garment) => void;
}

export function ItemRow({ g, i, onHover, hovered, onItem }: ItemRowProps) {
  return (
    <div
      className={cx('ir', hovered && 'ir-on')}
      onMouseEnter={() => onHover(i)}
      onMouseLeave={() => onHover(null)}
      onClick={() => onItem?.(g)}
    >
      <div className="ir-img" style={{ backgroundImage: `url(${g.imageUrl})` }} />
      <div className="ir-info">
        <div className="micro">{g.brand}</div>
        <div style={{ fontSize: 13.5, lineHeight: 1.3, marginTop: 2 }}>{g.name}</div>
        <div className="row gap-8" style={{ alignItems: 'baseline', marginTop: 6 }}>
          <span style={{ fontSize: 14, fontWeight: 500 }}>{fmt(g.phia.lowest)}</span>
          <span className="strike" style={{ fontSize: 11 }}>{fmt(g.retailPrice)}</span>
        </div>
        <div className="micro" style={{ fontSize: 9.5, marginTop: 3 }}>via {g.phia.source}</div>
      </div>
      <div className="ir-save"><SavingsBadge pct={g.phia.savings} /></div>
      <style jsx>{`
        .ir { display: grid; grid-template-columns: 56px 1fr auto; gap: 14px; padding: 12px 2px; border-bottom: 1px solid var(--line); align-items: center; cursor: pointer; }
        .ir:last-child { border-bottom: none; }
        .ir-on { background: var(--bg); border-radius: 8px; padding: 12px 10px; }
        .ir-img { aspect-ratio: 3/4; background: var(--bg-sub) center/cover no-repeat; border-radius: 6px; }
        .ir-save { align-self: flex-start; margin-top: 4px; }
      `}</style>
    </div>
  );
}
