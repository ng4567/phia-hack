// NewLookTile — dashed "+ New look" tile that starts the builder.
// Direct port of client.jsx:178–207.

import { Icon } from '@/components/Icon';

interface NewLookTileProps {
  onClick: () => void;
}

export function NewLookTile({ onClick }: NewLookTileProps) {
  return (
    <div className="new-look" onClick={onClick}>
      <div className="nl-inner">
        <div className="nl-icon"><Icon.plus /></div>
        <div className="serif-italic" style={{ fontSize: 22, lineHeight: 1 }}>New look</div>
        <div className="micro" style={{ fontSize: 10.5, color: 'var(--ink-4)', maxWidth: 160, textAlign: 'center', lineHeight: 1.5 }}>
          Drag garments onto a board. Generate a try-on.
        </div>
      </div>
      <style jsx>{`
        .new-look {
          background: var(--card);
          border: 1px dashed var(--line-2);
          border-radius: var(--radius);
          aspect-ratio: 3/4.3;
          cursor: pointer;
          display: flex; align-items: center; justify-content: center;
          transition: all .2s ease;
        }
        .new-look:hover { border-color: var(--ink-3); background: #FAF9F6; }
        .nl-inner { display: flex; flex-direction: column; align-items: center; gap: 12px; color: var(--ink-2); }
        .nl-icon {
          width: 44px; height: 44px; border-radius: 50%;
          background: var(--bg); display: flex; align-items: center; justify-content: center;
        }
      `}</style>
    </div>
  );
}
