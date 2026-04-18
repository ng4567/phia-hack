// LookCard — look tile for the client detail grid.
// Direct port of client.jsx:125–176.

import { fmt } from '@/lib/utils';
import { getGarment, lookTotals } from '@/lib/mock';
import type { Client, Look } from '@/lib/mock';
import { SavingsBadge } from '@/components/SavingsBadge';

interface LookCardProps {
  look: Look;
  client: Client;
  onClick: () => void;
}

interface StatusStyle {
  bg: string;
  fg: string;
  label: string;
}

export function LookCard({ look, client: _client, onClick }: LookCardProps) {
  const totals = lookTotals(look);
  const statusColor: StatusStyle = {
    ready: { bg: 'var(--accent-soft)', fg: 'var(--accent)', label: 'Ready to share' },
    shared: { bg: 'var(--sage-soft)', fg: 'var(--sage)', label: 'Shared' },
    draft: { bg: '#EEEAE3', fg: 'var(--ink-2)', label: 'Draft' },
  }[look.status];

  return (
    <div className="look-card" onClick={onClick}>
      <div className="lc-img" style={{ backgroundImage: `url(${look.coverUrl})` }}>
        <div className="lc-items">
          {look.garmentIds.slice(0, 4).map((gid, i) => {
            const g = getGarment(gid);
            if (!g) return null;
            return (
              <div key={gid} className="lc-thumb" style={{ backgroundImage: `url(${g.imageUrl})`, zIndex: 10 - i }} />
            );
          })}
          {look.garmentIds.length > 4 && <div className="lc-more">+{look.garmentIds.length - 4}</div>}
        </div>
      </div>
      <div className="lc-body">
        <div className="row" style={{ justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div className="micro">{look.createdAt}</div>
            <div className="serif-italic" style={{ fontSize: 22, lineHeight: 1.15, marginTop: 4 }}>{look.occasion}</div>
          </div>
          <span className="status-chip" style={{ background: statusColor.bg, color: statusColor.fg }}>
            {statusColor.label}
          </span>
        </div>
        <div className="row" style={{ justifyContent: 'space-between', alignItems: 'center', marginTop: 14 }}>
          <div className="row gap-8" style={{ alignItems: 'baseline' }}>
            <span style={{ fontSize: 16, fontWeight: 500 }}>{fmt(totals.phia)}</span>
            <span className="strike" style={{ fontSize: 12 }}>{fmt(totals.retail)}</span>
          </div>
          <SavingsBadge pct={totals.savingsPct} />
        </div>
      </div>
      <style jsx>{`
        .look-card { background: var(--card); border-radius: var(--radius); overflow: hidden; cursor: pointer; transition: transform .2s ease, box-shadow .2s ease; box-shadow: var(--shadow-sm); }
        .look-card:hover { transform: translateY(-2px); box-shadow: var(--shadow-md); }
        .lc-img { aspect-ratio: 3/4; background: var(--bg-sub) center/cover no-repeat; position: relative; }
        .lc-items { position: absolute; left: 12px; bottom: 12px; display: flex; gap: 4px; }
        .lc-thumb { width: 32px; height: 32px; border-radius: 6px; background: var(--card) center/cover no-repeat; border: 1.5px solid #fff; box-shadow: 0 2px 6px rgba(0,0,0,.15); }
        .lc-more { min-width: 32px; height: 32px; padding: 0 6px; border-radius: 6px; background: rgba(26,24,22,.82); color: #fff; display: flex; align-items: center; justify-content: center; font-size: 11px; }
        .lc-body { padding: 16px 18px 18px; }
        .status-chip { padding: 3px 9px; border-radius: 999px; font-size: 10.5px; letter-spacing: .02em; white-space: nowrap; }
      `}</style>
    </div>
  );
}
