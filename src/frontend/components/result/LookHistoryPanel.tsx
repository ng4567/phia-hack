'use client';

// LookHistoryPanel — right-side drawer showing version history.
//
// STUB: this component is referenced by result.jsx line 42 but was never
// defined in the mockup source. Implemented as a minimal design-consistent
// drawer to keep the port from crashing when the user clicks "History".

import { lookHistory } from '@/lib/mock';
import { Icon } from '@/components/Icon';

export interface LookHistoryPanelProps {
  lookId: string;
  onClose: () => void;
}

export function LookHistoryPanel({ lookId, onClose }: LookHistoryPanelProps) {
  const entries = lookHistory(lookId);

  return (
    <div className="lhp-back" onClick={onClose}>
      <aside className="lhp" onClick={(e) => e.stopPropagation()}>
        <button className="lhp-close" onClick={onClose}><Icon.close /></button>
        <div className="serif-italic lhp-title">Version history</div>
        <div className="micro" style={{ color: 'var(--ink-3)', marginTop: 4 }}>Every edit, swap, and share.</div>

        <div className="lhp-list">
          {entries.map((e, i) => (
            <div key={i} className="lhp-row">
              <div className="lhp-dot" />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13.5, lineHeight: 1.35 }}>{e.label}</div>
                <div className="micro" style={{ marginTop: 4 }}>{e.actor} · {e.at}</div>
              </div>
            </div>
          ))}
        </div>
      </aside>
      <style jsx>{`
        .lhp-back { position: fixed; inset: 0; background: rgba(26,24,22,0.35); backdrop-filter: blur(4px);
          z-index: 120; animation: fadeUp .2s ease; display: flex; justify-content: flex-end; }
        .lhp { width: 400px; max-height: 80vh; margin: auto 32px; background: var(--card);
          border-radius: var(--radius-lg); box-shadow: var(--shadow-lg); padding: 28px 30px 24px;
          position: relative; overflow-y: auto; }
        .lhp-close { position: absolute; top: 14px; right: 14px; width: 32px; height: 32px; border-radius: 50%;
          color: var(--ink-3); display: flex; align-items: center; justify-content: center; }
        .lhp-close:hover { background: var(--bg); color: var(--ink); }
        .lhp-title { font-size: 30px; line-height: 1.1; letter-spacing: -0.01em; }
        .lhp-list { margin-top: 22px; display: flex; flex-direction: column; gap: 2px; }
        .lhp-row { display: flex; gap: 14px; padding: 14px 4px; border-bottom: 1px solid var(--line); align-items: flex-start; }
        .lhp-row:last-child { border-bottom: none; }
        .lhp-dot { width: 8px; height: 8px; border-radius: 50%; background: var(--accent); margin-top: 6px; flex-shrink: 0; box-shadow: 0 0 0 3px rgba(217,119,87,0.15); }
      `}</style>
    </div>
  );
}
