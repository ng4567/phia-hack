// ClientEditorialCard — editorial 2-column layout with large italic name.
// Alternating text alignment: even index = left, odd index = right.
// Direct port of dashboard.jsx:162–186.

import { cx } from '@/lib/utils';
import type { Client } from '@/lib/mock';

interface ClientEditorialCardProps {
  client: Client;
  index: number;
  onClick: () => void;
}

export function ClientEditorialCard({ client, index, onClick }: ClientEditorialCardProps) {
  const right = index % 2 === 1;
  return (
    <div className="ec-card" onClick={onClick}>
      <div className="ec-photo" style={{ backgroundImage: `url(${client.photoUrl})` }} />
      <div className={cx('ec-meta', right && 'ec-right')}>
        <div className="micro">{client.location}</div>
        <div className="serif-italic" style={{ fontSize: 44, lineHeight: 1, margin: '6px 0 10px', letterSpacing: '-0.02em' }}>{client.name}</div>
        <div style={{ fontSize: 13.5, color: 'var(--ink-2)', lineHeight: 1.55, maxWidth: 320 }}>{client.notes}</div>
        <div className="row gap-16" style={{ marginTop: 18, fontSize: 12, color: 'var(--ink-3)' }}>
          <span>{client.looksCount} looks</span><span>·</span>
          <span>Size {client.sizing.top} / {client.sizing.bottom}</span><span>·</span>
          <span>{client.lastUpdated}</span>
        </div>
      </div>
      <style jsx>{`
        .ec-card { cursor: pointer; display: flex; flex-direction: column; gap: 14px; }
        .ec-photo { aspect-ratio: 4/5; background: var(--bg-sub) center/cover no-repeat; border-radius: var(--radius-lg); transition: transform .25s ease; }
        .ec-card:hover .ec-photo { transform: translateY(-3px); }
        .ec-meta { padding: 4px 6px; }
        .ec-right { text-align: right; }
      `}</style>
    </div>
  );
}
