// GarmentTile — catalog/board tile with image, brand, name, price.
// Ported from shared.jsx lines 111–160.

import { cx, fmt } from '@/lib/utils';
import type { Garment } from '@/lib/mock';
import { Icon } from './Icon';

export interface GarmentTileProps {
  garment: Garment;
  onClick?: () => void;
  showPhia?: boolean;
  variant?: 'compact';
  onRemove?: () => void;
}

export function GarmentTile({ garment, onClick, showPhia, variant, onRemove }: GarmentTileProps) {
  return (
    <div
      className={cx('garment-tile', variant && `gt-${variant}`)}
      onClick={onClick}
      style={{ cursor: onClick ? 'pointer' : 'default' }}
    >
      <div className="gt-img" style={{ backgroundImage: `url(${garment.imageUrl})` }}>
        {onRemove && (
          <button
            className="gt-remove"
            onClick={(e) => {
              e.stopPropagation();
              onRemove();
            }}
          >
            <Icon.x />
          </button>
        )}
      </div>
      <div className="col gap-4" style={{ padding: variant === 'compact' ? '8px 2px 2px' : '10px 2px 2px' }}>
        <div className="micro" style={{ color: 'var(--ink-3)' }}>{garment.brand}</div>
        <div style={{ fontSize: 13, lineHeight: 1.3, color: 'var(--ink)' }}>{garment.name}</div>
        {showPhia ? (
          <div className="row gap-6" style={{ marginTop: 4, alignItems: 'baseline' }}>
            <span style={{ fontSize: 13, fontWeight: 500 }}>{fmt(garment.phia.lowest)}</span>
            <span className="strike" style={{ fontSize: 11 }}>{fmt(garment.retailPrice)}</span>
          </div>
        ) : (
          <div style={{ fontSize: 12.5, color: 'var(--ink-2)', marginTop: 2 }}>{fmt(garment.retailPrice)}</div>
        )}
      </div>
      <style jsx>{`
        .garment-tile { display: flex; flex-direction: column; }
        .gt-img {
          aspect-ratio: 3/4;
          border-radius: var(--radius);
          background: var(--bg-sub) center/cover no-repeat;
          position: relative;
          transition: transform .2s ease;
        }
        .garment-tile:hover .gt-img { transform: translateY(-2px); }
        .gt-remove {
          position: absolute; top: 8px; right: 8px;
          width: 24px; height: 24px; border-radius: 50%;
          background: rgba(255,255,255,.92); color: var(--ink);
          display: flex; align-items: center; justify-content: center;
          opacity: 0; transition: opacity .15s ease;
        }
        .garment-tile:hover .gt-remove { opacity: 1; }
        .gt-compact .gt-img { aspect-ratio: 1 / 1.15; }
      `}</style>
    </div>
  );
}
