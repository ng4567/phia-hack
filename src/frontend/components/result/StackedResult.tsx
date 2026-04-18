// StackedResult — hero photo + grid of large cards. Alt layout.
// Direct port of result.jsx:123–158.

import { fmt } from '@/lib/utils';
import type { Client, Look, LookTotals } from '@/lib/mock';
import { SavingsBadge } from '@/components/SavingsBadge';
import { ItemCardBig } from './ItemCardBig';

export interface StackedResultProps {
  look: Look;
  client: Client;
  totals: LookTotals;
}

export function StackedResult({ look, client, totals }: StackedResultProps) {
  return (
    <div>
      <div className="stk-hero">
        <div className="stk-text">
          <div className="micro">{look.createdAt} · {client.name}</div>
          <h1
            className="serif-italic"
            style={{ fontSize: 80, lineHeight: 0.98, margin: '12px 0 22px', letterSpacing: '-0.02em' }}
          >
            {look.occasion}
          </h1>
          <div className="stk-totals">
            <div>
              <div className="micro">With phia</div>
              <div className="serif" style={{ fontSize: 72, lineHeight: 1, color: 'var(--accent)' }}>{fmt(totals.phia)}</div>
              <div className="row gap-10" style={{ marginTop: 10, alignItems: 'baseline' }}>
                <span className="strike serif" style={{ fontSize: 22 }}>{fmt(totals.retail)}</span>
                <SavingsBadge pct={totals.savingsPct} size="lg" />
              </div>
            </div>
          </div>
        </div>
        <div className="stk-photo" style={{ backgroundImage: `url(${look.tryOnImageUrl || look.coverUrl})` }} />
      </div>
      <div style={{ marginTop: 48 }}>
        <div className="micro" style={{ marginBottom: 16 }}>Inside the look</div>
        <div className="stk-items">
          {totals.garments.map((g) => <ItemCardBig key={g.id} g={g} />)}
        </div>
      </div>
      <style jsx>{`
        .stk-hero { display: grid; grid-template-columns: 1fr 480px; gap: 56px; align-items: flex-end; }
        .stk-photo { aspect-ratio: 4/5; background: var(--bg-sub) center/cover no-repeat;
          border-radius: var(--radius-xl); box-shadow: var(--shadow-md); }
        .stk-items { display: grid; grid-template-columns: repeat(5, 1fr); gap: 18px; }
        @media (max-width: 1200px) { .stk-hero { grid-template-columns: 1fr; } .stk-items { grid-template-columns: repeat(3, 1fr); } }
      `}</style>
    </div>
  );
}
