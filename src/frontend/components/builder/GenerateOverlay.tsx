// GenerateOverlay — chain-driven loader shown during try-on generate.
// Each chain garment = one step; copy and progress derive from real state.

import { useEffect, useRef, useState } from 'react';
import type { Client, Garment } from '@/lib/mock';

export type StepStatus = 'pending' | 'ok' | 'failed' | 'skipped';

export interface GenerateOverlayProps {
  client: Client;
  chainGarments: Garment[];
  activeStep: number;
  stepStatuses: StepStatus[];
  latestIntermediateUrl?: string;
}

export function GenerateOverlay({
  client,
  chainGarments,
  activeStep,
  stepStatuses,
  latestIntermediateUrl,
}: GenerateOverlayProps) {
  const total = Math.max(chainGarments.length, 1);
  const stepNumber = Math.min(activeStep + 1, total);
  const allDone = activeStep >= chainGarments.length;
  const currentGarment = chainGarments[activeStep];
  const primaryCopy = allDone || !currentGarment
    ? 'Your look is ready.'
    : `Fitting the ${currentGarment.name}…`;

  const photoUrl = latestIntermediateUrl ?? client.photoUrl;
  const progressPct = (stepNumber / total) * 100;

  // Crossfade: keep the previous image rendered until the new one mounts,
  // then fade it out (250ms) and drop it. No flicker to background.
  const [currentUrl, setCurrentUrl] = useState(photoUrl);
  const [previousUrl, setPreviousUrl] = useState<string | null>(null);
  const prevRef = useRef(photoUrl);
  useEffect(() => {
    if (photoUrl !== prevRef.current) {
      setPreviousUrl(prevRef.current);
      setCurrentUrl(photoUrl);
      prevRef.current = photoUrl;
      const t = window.setTimeout(() => setPreviousUrl(null), 260);
      return () => window.clearTimeout(t);
    }
  }, [photoUrl]);

  function dotFor(status: StepStatus, isActive: boolean): { glyph: string; color: string; opacity: number } {
    if (status === 'ok') return { glyph: '●', color: 'var(--accent)', opacity: 1 };
    if (status === 'failed') return { glyph: '✕', color: '#b00020', opacity: 1 };
    if (status === 'skipped') return { glyph: '○', color: 'var(--ink-4)', opacity: 0.5 };
    // pending
    if (isActive) return { glyph: '◐', color: 'var(--accent)', opacity: 0.7 };
    return { glyph: '○', color: 'var(--ink-4)', opacity: 1 };
  }

  function nameColor(status: StepStatus): string {
    if (status === 'failed') return '#b00020';
    if (status === 'skipped') return 'var(--ink-4)';
    return 'var(--ink-2)';
  }

  return (
    <div className="gen-overlay">
      <div className="gen-inner">
        <div className="gen-photo">
          {previousUrl && (
            <div
              key={'prev:' + previousUrl}
              className="gen-photo-img gen-photo-fade-out"
              style={{ backgroundImage: `url(${previousUrl})` }}
            />
          )}
          <div
            key={'cur:' + currentUrl}
            className="gen-photo-img gen-photo-fade-in"
            style={{ backgroundImage: `url(${currentUrl})` }}
          />
          <div className="gen-shimmer" />
        </div>
        <div className="col" style={{ alignItems: 'center', marginTop: 28, maxWidth: 520, textAlign: 'center' }}>
          <div className="micro" style={{ color: 'var(--ink-4)' }}>
            {String(stepNumber).padStart(2, '0')} / {String(total).padStart(2, '0')}
          </div>
          <div className="serif-italic" style={{ fontSize: 36, lineHeight: 1.15, margin: '10px 0 6px' }}>
            {primaryCopy}
          </div>
          <div style={{ fontSize: 13, color: 'var(--ink-3)' }}>Usually ~12s per piece.</div>
          <div className="gen-dots">
            {chainGarments.map((g, i) => {
              const status = stepStatuses[i] ?? 'pending';
              const isActive = i === activeStep && status === 'pending';
              const { glyph, color, opacity } = dotFor(status, isActive);
              return (
                <span
                  key={g.id + ':' + i}
                  className="gen-dot"
                  style={{ color, opacity }}
                  aria-label={`Step ${i + 1} ${status}`}
                >
                  {glyph}
                </span>
              );
            })}
          </div>
          <div className="gen-subcopy">
            {chainGarments.map((g, i) => {
              const status = stepStatuses[i] ?? 'pending';
              return (
                <span key={g.id + ':name:' + i}>
                  {i > 0 && <span className="gen-sep"> · </span>}
                  <span style={{ color: nameColor(status) }}>{g.name}</span>
                </span>
              );
            })}
          </div>
          <div className="gen-bar">
            <div className="gen-fill" style={{ width: `${progressPct}%` }} />
          </div>
        </div>
      </div>
      <style jsx>{`
        .gen-overlay {
          position: fixed; inset: 0; background: rgba(245,244,241,0.96);
          backdrop-filter: blur(8px); z-index: 100;
          display: flex; align-items: center; justify-content: center;
          animation: fadeUp .25s ease both;
        }
        .gen-inner { display: flex; flex-direction: column; align-items: center; }
        .gen-photo {
          width: 260px; aspect-ratio: 4/5; border-radius: var(--radius-lg);
          background: var(--bg-sub) center/cover no-repeat; position: relative; overflow: hidden;
          box-shadow: var(--shadow-md);
        }
        .gen-photo-img {
          position: absolute; inset: 0;
          background-position: center; background-size: cover; background-repeat: no-repeat;
        }
        .gen-photo-fade-in { animation: photoFadeIn .25s ease both; }
        .gen-photo-fade-out { animation: photoFadeOut .25s ease both; }
        @keyframes photoFadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes photoFadeOut { from { opacity: 1; } to { opacity: 0; } }
        .gen-shimmer {
          position: absolute; inset: 0;
          background: linear-gradient(180deg, rgba(217,119,87,0.0) 0%, rgba(217,119,87,0.25) 50%, rgba(217,119,87,0.0) 100%);
          animation: shimmer 2.2s infinite linear;
        }
        @keyframes shimmer { 0% { transform: translateY(-100%); } 100% { transform: translateY(100%); } }
        .gen-dots {
          display: flex; gap: 14px; align-items: center; justify-content: center;
          margin-top: 16px; font-size: 18px; line-height: 1;
        }
        .gen-dot { display: inline-block; transition: color .2s ease, opacity .2s ease; }
        .gen-subcopy {
          margin-top: 8px; font-size: 12px; color: var(--ink-3);
          display: flex; flex-wrap: wrap; justify-content: center; gap: 0 2px;
          max-width: 420px;
        }
        .gen-sep { color: var(--ink-4); margin: 0 6px; }
        .gen-bar { margin-top: 18px; width: 240px; height: 2px; background: var(--line); border-radius: 2px; overflow: hidden; }
        .gen-fill { height: 100%; background: var(--accent); transition: width .9s ease; }
      `}</style>
    </div>
  );
}
