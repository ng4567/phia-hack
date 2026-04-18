// NewClientCard — dashed outline "Add a client" placeholder.
// Direct port of dashboard.jsx:188–210.

import { Icon } from '@/components/Icon';

export function NewClientCard() {
  return (
    <div className="new-client">
      <div className="nc-inner">
        <Icon.plus />
        <div style={{ fontSize: 13 }}>Add a client</div>
        <div className="micro" style={{ color: 'var(--ink-4)', fontSize: 10 }}>Invite by email or SMS</div>
      </div>
      <style jsx>{`
        .new-client {
          aspect-ratio: 0.78;
          border: 1px dashed var(--line-2);
          border-radius: var(--radius);
          display: flex; align-items: center; justify-content: center;
          color: var(--ink-3); cursor: pointer;
          transition: all .2s ease;
        }
        .new-client:hover { background: var(--card); border-color: var(--ink-4); color: var(--ink-2); }
        .nc-inner { display: flex; flex-direction: column; align-items: center; gap: 8px; }
      `}</style>
    </div>
  );
}
