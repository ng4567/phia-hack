'use client';

// CompileDossierOverlay — full-viewport ivory scrim that plays the
// "compiling dossier" animation when a stylist opens a client. Driven by
// a single master timeline of setTimeout handles stored in a ref so the
// overlay can dismiss early (Esc or outer-click) without leaking timers.
//
// The data we surface (receipt count, brand count, event count, style
// keywords) is derived synchronously from the same Gmail/Calendar/Outlook
// fixtures the client detail page renders. Fixtures are imported
// statically (Next.js does not support dynamic template imports for JSON)
// and selected by clientId at runtime.

import { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

import { Icon } from '@/components/Icon';
import {
  GmailLogo,
  GoogleCalendarLogo,
  OutlookLogo,
} from '@/components/brand/ServiceLogo';
import { getClient } from '@/lib/mock';

import phoebeGmail from '@/lib/mock/client-phoebe-gmail.json';
import phoebeCalendar from '@/lib/mock/client-phoebe-calendar.json';
import phoebeOutlook from '@/lib/mock/client-phoebe-outlook.json';
import sophiaGmail from '@/lib/mock/client-sophia-gmail.json';
import sophiaCalendar from '@/lib/mock/client-sophia-calendar.json';
import sophiaOutlook from '@/lib/mock/client-sophia-outlook.json';

// ── Fixture shape helpers ────────────────────────────────────────────────
// The raw JSON files wrap their payload in `{ garments: [...] }` or
// `{ events: [...] }`. Unwrap once at module load so the rest of the file
// can treat them as plain arrays.

interface GmailGarment {
  brand?: string;
}
interface CalendarEvent {
  style_keywords?: string[];
}

type FixtureBundle = {
  gmail: GmailGarment[];
  calendar: CalendarEvent[];
  outlook: CalendarEvent[];
};

const unwrapGmail = (raw: unknown): GmailGarment[] => {
  const g = (raw as { garments?: GmailGarment[] } | null)?.garments;
  return Array.isArray(g) ? g : [];
};
const unwrapEvents = (raw: unknown): CalendarEvent[] => {
  const e = (raw as { events?: CalendarEvent[] } | null)?.events;
  return Array.isArray(e) ? e : [];
};

const FIXTURES: Record<string, FixtureBundle> = {
  sarah: {
    gmail: unwrapGmail(phoebeGmail),
    calendar: unwrapEvents(phoebeCalendar),
    outlook: unwrapEvents(phoebeOutlook),
  },
  maya: {
    gmail: unwrapGmail(sophiaGmail),
    calendar: unwrapEvents(sophiaCalendar),
    outlook: unwrapEvents(sophiaOutlook),
  },
};

const FALLBACK = {
  receiptCount: 42,
  brandCount: 9,
  eventCount: 4,
  keywords: ['muted', 'structured', 'considered'] as string[],
};

// ── Timing table ─────────────────────────────────────────────────────────
// All offsets in ms, measured from the overlay mount. Must stay ≤ 7000ms
// end-to-end (plan constraint).
const T = {
  introFadeIn: 0,
  line1Start: 600,
  line1Tick: 1500,
  line2Start: 1800,
  line2Tick: 2800,
  line3Start: 3100,
  line3Tick: 4100,
  line4Start: 4400,
  line4Tick: 5300,
  compress: 5500,
  fadeOut: 5900,
  complete: 6150, // fadeOut + 250ms
} as const;

const CHAR_INTERVAL_MS = 40;

// ── Small sage tick ──────────────────────────────────────────────────────
function SageTick() {
  // Prefer the shared Icon.check for visual consistency with the rest of
  // the UI; fall back colour is sage-green via inline style.
  return (
    <span
      aria-hidden="true"
      style={{
        color: 'var(--sage)',
        display: 'inline-flex',
        alignItems: 'center',
      }}
    >
      <Icon.check />
    </span>
  );
}

// ── Initials helper ──────────────────────────────────────────────────────
function initialsOf(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? '')
    .join('');
}

// ── Typewriter sub-component ─────────────────────────────────────────────
// Reveals `children` one character at a time once `active` becomes true.
// When `done` is true the full text is shown regardless of typewriter
// progress (used for lines above the active one).
interface TypewriterLineProps {
  text: string;
  active: boolean;
  done: boolean;
}

function TypewriterLine({ text, active, done }: TypewriterLineProps) {
  const [visible, setVisible] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (done) {
      setVisible(text.length);
      return;
    }
    if (!active) {
      setVisible(0);
      return;
    }
    // Typing phase.
    setVisible(0);
    intervalRef.current = setInterval(() => {
      setVisible((v) => {
        if (v >= text.length) {
          if (intervalRef.current) clearInterval(intervalRef.current);
          return v;
        }
        return v + 1;
      });
    }, CHAR_INTERVAL_MS);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [active, done, text]);

  return <>{text.slice(0, visible)}</>;
}

// ── Main component ───────────────────────────────────────────────────────
export interface CompileDossierOverlayProps {
  clientId: string;
  onComplete: () => void;
}

export function CompileDossierOverlay({
  clientId,
  onComplete,
}: CompileDossierOverlayProps) {
  const client = getClient(clientId);
  const firstName = client?.name.split(' ')[0] ?? 'your client';

  // Derive counts + keywords from the fixtures (or fall back).
  const { receiptCount, brandCount, eventCount, keywords } = useMemo(() => {
    const f = FIXTURES[clientId];
    if (!f) {
      return {
        receiptCount: FALLBACK.receiptCount,
        brandCount: FALLBACK.brandCount,
        eventCount: FALLBACK.eventCount,
        keywords: FALLBACK.keywords,
      };
    }
    const receipts = f.gmail.length || FALLBACK.receiptCount;
    const brands =
      new Set(f.gmail.map((g) => g.brand).filter(Boolean)).size ||
      FALLBACK.brandCount;
    const events = f.calendar.length + f.outlook.length || FALLBACK.eventCount;
    const kws = Array.from(
      new Set(
        f.calendar.flatMap((e) =>
          Array.isArray(e.style_keywords) ? e.style_keywords : [],
        ),
      ),
    ).slice(0, 3);
    return {
      receiptCount: receipts,
      brandCount: brands,
      eventCount: events,
      keywords: kws.length > 0 ? kws : FALLBACK.keywords,
    };
  }, [clientId]);

  // Line text is computed once so the typewriter has a stable string.
  const lines = useMemo(
    () => [
      { prefix: '', text: `Reading ${firstName}'s Gmail…`, showLogos: 'gmail' as const },
      {
        prefix: '',
        text: `${receiptCount} receipts synced · ${brandCount} brands identified`,
        showLogos: null,
      },
      {
        prefix: '',
        text: `${eventCount} upcoming events across Calendar + Outlook`,
        showLogos: 'cal+outlook' as const,
      },
      {
        prefix: '',
        text: `Style keywords: ${keywords.join(', ')}`,
        showLogos: null,
      },
    ],
    [firstName, receiptCount, brandCount, eventCount, keywords],
  );

  // ── Phase state driven by the master timeline ──────────────────────
  // `activeLine` = the line currently typewriting (0-3, -1 = none yet)
  // `tickedLines` = number of lines that have already ticked (0..4)
  // `compressing` = final compress+fade phase toggle
  const [activeLine, setActiveLine] = useState<number>(-1);
  const [tickedLines, setTickedLines] = useState<number>(0);
  const [compressing, setCompressing] = useState(false);
  const [visible, setVisible] = useState(true);

  // All pending timeouts — cleared on unmount or early dismiss.
  const timeoutsRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const finishedRef = useRef(false);

  const clearAll = () => {
    timeoutsRef.current.forEach((t) => clearTimeout(t));
    timeoutsRef.current = [];
  };

  const completeOnce = () => {
    if (finishedRef.current) return;
    finishedRef.current = true;
    clearAll();
    onComplete();
  };

  const dismissEarly = () => {
    // Skip any remaining animation and hand control back immediately.
    setVisible(false);
    completeOnce();
  };

  // Schedule the master timeline.
  useEffect(() => {
    const push = (delay: number, fn: () => void) => {
      timeoutsRef.current.push(setTimeout(fn, delay));
    };

    push(T.line1Start, () => setActiveLine(0));
    push(T.line1Tick, () => setTickedLines(1));
    push(T.line2Start, () => setActiveLine(1));
    push(T.line2Tick, () => setTickedLines(2));
    push(T.line3Start, () => setActiveLine(2));
    push(T.line3Tick, () => setTickedLines(3));
    push(T.line4Start, () => setActiveLine(3));
    push(T.line4Tick, () => setTickedLines(4));
    push(T.compress, () => setCompressing(true));
    push(T.fadeOut, () => setVisible(false));
    push(T.complete, () => completeOnce());

    return () => {
      clearAll();
    };
    // Intentionally empty deps — the timeline runs exactly once on mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Esc-to-dismiss.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') dismissEarly();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Render ─────────────────────────────────────────────────────────
  const photoSrc = client?.photoUrl ?? '';
  const showPhoto = photoSrc.length > 0;

  return (
    <AnimatePresence onExitComplete={() => completeOnce()}>
      {visible && (
        <motion.div
          key="compile-overlay"
          role="dialog"
          aria-label="Compiling dossier"
          aria-live="polite"
          className="compile-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          onClick={dismissEarly}
        >
          <motion.div
            className="compile-inner"
            onClick={(e) => e.stopPropagation()}
            initial={{ opacity: 0, y: 8 }}
            animate={{
              opacity: 1,
              y: 0,
              scale: compressing ? 0.96 : 1,
            }}
            transition={{ duration: 0.3 }}
          >
            <motion.div
              className="compile-portrait"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{
                opacity: 1,
                scale: compressing ? 1.05 : 1,
              }}
              transition={{ duration: 0.3 }}
              style={
                showPhoto
                  ? { backgroundImage: `url(${photoSrc})` }
                  : undefined
              }
            >
              {!showPhoto && (
                <span className="compile-portrait-initials">
                  {initialsOf(client?.name ?? 'C')}
                </span>
              )}
            </motion.div>

            <div className="compile-eyebrow micro">
              Compiling {firstName}&apos;s dossier
            </div>

            <ul className="compile-lines" aria-hidden={compressing}>
              {lines.map((l, i) => {
                const done = tickedLines > i;
                const active = activeLine === i && !done;
                const rendered = activeLine >= i; // show row once its phase has started

                return (
                  <motion.li
                    key={i}
                    className="compile-line serif-italic"
                    initial={{ opacity: 0, y: 4 }}
                    animate={{
                      opacity: rendered ? (compressing ? 0 : 1) : 0,
                      y: rendered ? (compressing ? -6 : 0) : 4,
                    }}
                    transition={{ duration: 0.28 }}
                  >
                    {/* Logo cluster (per-line) */}
                    <span className="compile-line-logos">
                      {l.showLogos === 'gmail' && <GmailLogo size={18} />}
                      {l.showLogos === 'cal+outlook' && (
                        <>
                          <GoogleCalendarLogo key="cal" size={18} />
                          <OutlookLogo key="outlook" size={18} />
                        </>
                      )}
                    </span>

                    <span className="compile-line-text">
                      <TypewriterLine
                        text={l.text}
                        active={active}
                        done={done}
                      />
                    </span>

                    <span className="compile-line-tick">
                      {done && <SageTick />}
                    </span>
                  </motion.li>
                );
              })}
            </ul>
          </motion.div>
        </motion.div>
      )}

      <style jsx global>{`
        .compile-overlay {
          position: fixed;
          inset: 0;
          z-index: 100;
          background: var(--bg);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 48px 24px;
        }

        .compile-inner {
          width: 100%;
          max-width: 640px;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 22px;
        }

        .compile-portrait {
          width: 72px;
          height: 72px;
          border-radius: 50%;
          background: var(--bg-sub) center/cover no-repeat;
          box-shadow: var(--shadow-md);
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
        }
        .compile-portrait-initials {
          font-family: var(--font-serif), Georgia, serif;
          font-style: italic;
          font-size: 26px;
          color: var(--ink-2);
        }

        .compile-eyebrow {
          text-align: center;
        }

        .compile-lines {
          list-style: none;
          margin: 0;
          padding: 0;
          width: 100%;
          display: flex;
          flex-direction: column;
          gap: 14px;
        }

        .compile-line {
          display: grid;
          grid-template-columns: 44px 1fr 24px;
          align-items: center;
          gap: 14px;
          font-size: 24px;
          line-height: 1.35;
          color: var(--ink-2);
          min-height: 34px;
        }

        .compile-line-logos {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          justify-content: flex-start;
        }

        .compile-line-text {
          display: inline-block;
        }

        .compile-line-tick {
          display: inline-flex;
          align-items: center;
          justify-content: flex-end;
        }

        @media (max-width: 640px) {
          .compile-line {
            font-size: 18px;
            grid-template-columns: 38px 1fr 22px;
            gap: 10px;
          }
          .compile-inner {
            gap: 18px;
          }
        }
      `}</style>
    </AnimatePresence>
  );
}
