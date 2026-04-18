// GenerateOverlay — fake 4-step loader shown during try-on generate.
// Direct port of builder.jsx:240–280.

import type { Client } from '@/lib/mock';

export interface GenerateOverlayProps {
  client: Client;
  step: number;
}

export function GenerateOverlay({ client, step }: GenerateOverlayProps) {
  const copy = [
    'Reading the room — rooftop, July, dusk.',
    `Fitting ${client.name.split(' ')[0]}'s measurements to the pieces…`,
    'Asking phia for the lowest price on every item…',
    'Your look is ready.',
  ];
  return (
    <div className="gen-overlay">
      <div className="gen-inner">
        <div className="gen-photo" style={{ backgroundImage: `url(${client.photoUrl})` }}>
          <div className="gen-shimmer" />
        </div>
        <div className="col" style={{ alignItems: 'center', marginTop: 28, maxWidth: 460, textAlign: 'center' }}>
          <div className="micro" style={{ color: 'var(--ink-4)' }}>{String(step + 1).padStart(2, '0')} / 04</div>
          <div className="serif-italic" style={{ fontSize: 36, lineHeight: 1.15, margin: '10px 0 6px' }}>
            {copy[step]}
          </div>
          <div style={{ fontSize: 13, color: 'var(--ink-3)' }}>Usually takes 8 seconds.</div>
          <div className="gen-bar"><div className="gen-fill" style={{ width: `${(step + 1) * 25}%` }} /></div>
        </div>
      </div>
      <style jsx>{`
        .gen-overlay { position: fixed; inset: 0; background: rgba(245,244,241,0.96); backdrop-filter: blur(8px); z-index: 100;
          display: flex; align-items: center; justify-content: center; animation: fadeUp .25s ease both; }
        .gen-inner { display: flex; flex-direction: column; align-items: center; }
        .gen-photo { width: 260px; aspect-ratio: 4/5; border-radius: var(--radius-lg);
          background: var(--bg-sub) center/cover no-repeat; position: relative; overflow: hidden;
          box-shadow: var(--shadow-md); }
        .gen-shimmer {
          position: absolute; inset: 0;
          background: linear-gradient(180deg, rgba(217,119,87,0.0) 0%, rgba(217,119,87,0.25) 50%, rgba(217,119,87,0.0) 100%);
          animation: shimmer 2.2s infinite linear;
        }
        @keyframes shimmer { 0% { transform: translateY(-100%); } 100% { transform: translateY(100%); } }
        .gen-bar { margin-top: 18px; width: 240px; height: 2px; background: var(--line); border-radius: 2px; overflow: hidden; }
        .gen-fill { height: 100%; background: var(--accent); transition: width .9s ease; }
      `}</style>
    </div>
  );
}
