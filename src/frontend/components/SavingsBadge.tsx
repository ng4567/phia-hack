// SavingsBadge — small sage pill showing "X% less".
// Ported from shared.jsx lines 77–93.

import { Icon } from './Icon';

export interface SavingsBadgeProps {
  pct: number;
  size?: 'sm' | 'lg';
}

export function SavingsBadge({ pct, size = 'sm' }: SavingsBadgeProps) {
  const isBig = size === 'lg';
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
        padding: isBig ? '6px 12px' : '3px 8px',
        borderRadius: 999,
        background: 'var(--sage-soft)',
        color: 'var(--sage)',
        fontSize: isBig ? 12 : 10.5,
        fontWeight: 500,
        letterSpacing: isBig ? 0 : '.02em',
      }}
    >
      <Icon.leaf /> {pct}% less
    </span>
  );
}
