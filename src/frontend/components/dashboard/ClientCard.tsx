// ClientCard — grid-mode card with photo accent strip, name, location,
// looks count, notes. Direct port of dashboard.jsx:126–160.

import { Icon } from '@/components/Icon';
import type { Client } from '@/lib/mock';

interface ClientCardProps {
  client: Client;
  onClick: () => void;
}

export function ClientCard({ client, onClick }: ClientCardProps) {
  return (
    <div className="card client-card" onClick={onClick}>
      <div className="cc-photo" style={{ backgroundImage: `url(${client.photoUrl})` }}>
        <div className="cc-accent" style={{ background: client.accent }} />
      </div>
      <div className="cc-body">
        <div className="row" style={{ justifyContent: 'space-between', alignItems: 'baseline' }}>
          <div>
            <div className="serif" style={{ fontSize: 22, lineHeight: 1.1 }}>{client.name}</div>
            <div className="micro" style={{ marginTop: 5 }}>{client.location}</div>
          </div>
          <div className="col" style={{ alignItems: 'flex-end', gap: 2 }}>
            <div className="serif" style={{ fontSize: 20 }}>{client.looksCount}</div>
            <div className="micro" style={{ fontSize: 9.5 }}>Looks</div>
          </div>
        </div>
        <div style={{ fontSize: 12.5, color: 'var(--ink-2)', marginTop: 12, lineHeight: 1.5, minHeight: 40 }}>{client.notes.slice(0, 88)}…</div>
        <div className="row" style={{ marginTop: 18, justifyContent: 'space-between', alignItems: 'center' }}>
          <div className="micro">Updated {client.lastUpdated}</div>
          <div className="row gap-6" style={{ color: 'var(--ink-2)', fontSize: 12 }}>
            Open <Icon.arrow />
          </div>
        </div>
      </div>
      <style jsx>{`
        .client-card { overflow: hidden; cursor: pointer; transition: transform .2s ease, box-shadow .2s ease; }
        .client-card:hover { transform: translateY(-2px); box-shadow: var(--shadow-md); }
        .cc-photo { aspect-ratio: 4/3; background: var(--bg-sub) center/cover no-repeat; position: relative; }
        .cc-accent { position:absolute; bottom:0; left:0; right:0; height:3px; }
        .cc-body { padding: 20px 22px 22px; }
      `}</style>
    </div>
  );
}
