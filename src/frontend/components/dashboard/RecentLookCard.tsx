// RecentLookCard — small tile with status chip and pricing.
// Direct port of dashboard.jsx:212–238.

import { fmt } from '@/lib/utils';
import { lookTotals } from '@/lib/mock';
import type { Client, Look } from '@/lib/mock';

interface RecentLookCardProps {
  look: Look;
  client: Client;
  onClick: () => void;
}

export function RecentLookCard({ look, client, onClick }: RecentLookCardProps) {
  const totals = lookTotals(look);
  return (
    <div className="rlc" onClick={onClick}>
      <div className="rlc-img" style={{ backgroundImage: `url(${look.coverUrl})` }}>
        {look.status === 'ready' && <span className="rlc-chip">New</span>}
        {look.status === 'draft' && <span className="rlc-chip rlc-draft">Draft</span>}
      </div>
      <div style={{ padding: '10px 2px 2px' }}>
        <div className="micro">{client.name.split(' ')[0]} · {look.createdAt}</div>
        <div className="serif-italic" style={{ fontSize: 17, lineHeight: 1.2, margin: '4px 0 6px' }}>{look.occasion}</div>
        <div className="row gap-8" style={{ alignItems: 'baseline' }}>
          <span style={{ fontSize: 13, fontWeight: 500 }}>{fmt(totals.phia)}</span>
          <span className="strike" style={{ fontSize: 11 }}>{fmt(totals.retail)}</span>
        </div>
      </div>
      <style jsx>{`
        .rlc { cursor: pointer; }
        .rlc-img { aspect-ratio: 3/4; background: var(--bg-sub) center/cover no-repeat; border-radius: var(--radius); position: relative; transition: transform .2s ease; }
        .rlc:hover .rlc-img { transform: translateY(-2px); }
        .rlc-chip { position: absolute; top: 10px; left: 10px; padding: 3px 9px; border-radius: 999px;
          background: rgba(255,255,255,.92); color: var(--ink); font-size: 10px; letter-spacing: .08em; text-transform: uppercase; }
        .rlc-draft { background: rgba(26,24,22,.82); color: #fff; }
      `}</style>
    </div>
  );
}
