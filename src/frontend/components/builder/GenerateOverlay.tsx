// GenerateOverlay — chain-driven loader shown during try-on generate.
// Each chain garment = one step; copy and progress derive from real state.

import { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import type { Client, Garment } from '@/lib/mock';

export type StepStatus = 'pending' | 'ok' | 'failed' | 'skipped';

export interface GenerateOverlayProps {
  client: Client;
  chainGarments: Garment[];
  activeStep: number;
  stepStatuses: StepStatus[];
  latestIntermediateUrl?: string;
}

// ─── Typewriter phrase pools ────────────────────────────────────────────────
// Garment-aware micro-stage copy cycled by TypewriterCaption while the
// FAL try-on is composing. Keys intentionally mirror the semantic buckets
// we want to address; actual `Garment.category` values are normalised to
// these keys via `pickPhrases`.

const PHRASE_POOLS: Record<string, string[]> = {
  dress: [
    'Reading the silhouette…',
    'Draping the shoulder line…',
    'Falling the hem…',
    'Settling the fabric…',
    'Matching the tones…',
  ],
  top: [
    'Reading the shoulder…',
    'Sitting the collar…',
    'Falling the sleeve…',
    'Easing the back…',
    'Matching the tones…',
  ],
  bottom: [
    'Finding the rise…',
    'Sitting the waist…',
    'Falling the hem…',
    'Easing the inseam…',
    'Matching the tones…',
  ],
  outerwear: [
    'Squaring the shoulder…',
    'Setting the lapel…',
    'Falling the sleeve…',
    'Closing the front…',
    'Matching the tones…',
  ],
  shoe: [
    'Measuring the last…',
    'Setting the shaft…',
    'Matching the tones…',
  ],
  accessory: [
    'Reading the proportions…',
    'Finding the drape…',
    'Matching the tones…',
  ],
  _default: [
    'Reading the silhouette…',
    'Fitting the form…',
    'Matching the tones…',
    'Finishing the look…',
  ],
};

// Resolve a free-form category string to a PHRASE_POOLS key. Actual
// `Garment.category` values in src/frontend/lib/mock.ts are:
//   'top' | 'bottom' | 'one-piece' | 'outerwear' | 'shoes' | 'accessory'
// so 'one-piece' is aliased to 'dress' and 'shoes' to 'shoe'; the extra
// aliases below cover plausible variants if the catalog grows.
function pickPhrases(category?: string): string[] {
  const key = (category ?? '').trim().toLowerCase();
  const aliases: Record<string, keyof typeof PHRASE_POOLS> = {
    // real categories from mock.ts
    'one-piece': 'dress',
    shoes: 'shoe',
    // plausible variants / future-proofing
    dress: 'dress',
    gown: 'dress',
    jumpsuit: 'dress',
    jacket: 'outerwear',
    coat: 'outerwear',
    blouse: 'top',
    shirt: 'top',
    tee: 'top',
    knit: 'top',
    sweater: 'top',
    trouser: 'bottom',
    trousers: 'bottom',
    pant: 'bottom',
    pants: 'bottom',
    jean: 'bottom',
    jeans: 'bottom',
    skirt: 'bottom',
    short: 'bottom',
    shorts: 'bottom',
    boot: 'shoe',
    boots: 'shoe',
    shoe: 'shoe',
    sneaker: 'shoe',
    sneakers: 'shoe',
    heel: 'shoe',
    heels: 'shoe',
    mule: 'shoe',
    mules: 'shoe',
    bag: 'accessory',
    scarf: 'accessory',
    jewelry: 'accessory',
    hat: 'accessory',
    belt: 'accessory',
  };
  const resolved = aliases[key] ?? (key as keyof typeof PHRASE_POOLS);
  return PHRASE_POOLS[resolved] ?? PHRASE_POOLS._default;
}

// ─── TypewriterCaption ──────────────────────────────────────────────────────
// Cycles through `phrases`, typing each in at 45ms/char, holding 1500ms,
// then crossfading to the next. Resets fully when `cycleKey` changes.

interface TypewriterCaptionProps {
  phrases: string[];
  /** Change this when the active garment changes — resets the cycle. */
  cycleKey: string;
}

const CHAR_INTERVAL_MS = 45;
const HOLD_MS = 1500;
const FADE_MS = 200;

function TypewriterCaption({ phrases, cycleKey }: TypewriterCaptionProps) {
  const [phraseIndex, setPhraseIndex] = useState(0);
  const [charsVisible, setCharsVisible] = useState(0);

  // Bag of every pending setInterval / setTimeout handle. Any state change
  // that would start a new timer first drains this list, so we never leak
  // on unmount, on cycleKey change, or when a phrase finishes typing.
  const timersRef = useRef<Array<ReturnType<typeof setTimeout>>>([]);

  const clearTimers = () => {
    timersRef.current.forEach((t) => {
      clearTimeout(t);
      clearInterval(t as unknown as ReturnType<typeof setInterval>);
    });
    timersRef.current = [];
  };

  // Reset phrase cycle whenever the active garment changes.
  useEffect(() => {
    clearTimers();
    setPhraseIndex(0);
    setCharsVisible(0);
    return () => {
      clearTimers();
    };
  }, [cycleKey]);

  // Type-in + hold + advance for the current phraseIndex.
  useEffect(() => {
    clearTimers();
    const phrase = phrases[phraseIndex] ?? '';
    if (phrase.length === 0) return;

    setCharsVisible(0);

    // Typing interval — steps charsVisible up to phrase.length then stops.
    const typingInterval = setInterval(() => {
      setCharsVisible((v) => {
        if (v >= phrase.length) {
          clearInterval(typingInterval);
          return v;
        }
        return v + 1;
      });
    }, CHAR_INTERVAL_MS);
    timersRef.current.push(typingInterval);

    // Hold timer — fires once the typing has had enough time to complete,
    // then advances phraseIndex (which triggers the AnimatePresence
    // crossfade and the next run of this effect).
    const holdDelay = phrase.length * CHAR_INTERVAL_MS + HOLD_MS;
    const holdTimeout = setTimeout(() => {
      setPhraseIndex((i) => (i + 1) % Math.max(phrases.length, 1));
    }, holdDelay);
    timersRef.current.push(holdTimeout);

    return () => {
      clearTimers();
    };
  }, [phraseIndex, phrases]);

  const phrase = phrases[phraseIndex] ?? '';

  return (
    <AnimatePresence mode="wait">
      <motion.span
        key={phraseIndex}
        className="serif-italic"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: FADE_MS / 1000 }}
      >
        {phrase.slice(0, charsVisible)}
      </motion.span>
    </AnimatePresence>
  );
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
  const activeGarment = chainGarments[activeStep];
  const done = allDone || !activeGarment;

  // Memoize so the array reference is stable across re-renders while
  // waiting on the same garment — otherwise TypewriterCaption's main
  // effect re-runs on every render and the typewriter never advances.
  const phrases = useMemo(
    () => pickPhrases(activeGarment?.category),
    [activeGarment?.category],
  );

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
          <div
            className="serif-italic"
            style={{ fontSize: 36, lineHeight: 1.15, margin: '10px 0 6px', minHeight: '1.3em' }}
          >
            {done ? (
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.25 }}
              >
                Your look is ready.
              </motion.span>
            ) : (
              <TypewriterCaption
                phrases={phrases}
                cycleKey={activeGarment?.id ?? 'idle'}
              />
            )}
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
