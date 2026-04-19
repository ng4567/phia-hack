'use client';

// PreferencesPanel — read-only surfacing of `client-<id>-preferences.json`
// for the stylist. Lives in the left column below the Gmail closet on
// the client-detail page. Four blocks:
//   - Brands           (horizontal pill row)
//   - Sizes            (3-cell grid)
//   - Budget           (short prose line)
//   - Aesthetic        (2–3 sentence block)
//   - Resale-first     (single chip — sage-soft when on)
//
// Static JSON is imported at build time — one module per known client
// so the bundle tree-shakes cleanly. Unknown clientIds render an empty
// state rather than throwing, so adding a new client without a
// preferences fixture doesn't crash the page.

import phoebePrefs from '@/lib/mock/client-phoebe-preferences.json';
import sophiaPrefs from '@/lib/mock/client-sophia-preferences.json';
import type { ClientPreferences } from '@/lib/mock/types';

const PREFS_BY_CLIENT: Record<string, ClientPreferences> = {
  sarah: phoebePrefs as ClientPreferences,
  maya: sophiaPrefs as ClientPreferences,
};

export interface PreferencesPanelProps {
  clientId: string;
}

export function PreferencesPanel({ clientId }: PreferencesPanelProps) {
  const prefs = PREFS_BY_CLIENT[clientId];

  if (!prefs) {
    return (
      <section className="pp-root">
        <header className="pp-head">
          <div className="micro">Preferences</div>
          <h3 className="serif-italic pp-title">Not captured yet</h3>
        </header>
        <p className="pp-empty">
          Add a preferences file for this client to surface brand, sizing,
          and aesthetic notes here.
        </p>

        <style jsx>{`
          .pp-root {
            background: var(--card);
            border-radius: var(--radius-lg);
            padding: 24px 26px 26px;
            box-shadow: var(--shadow-sm);
          }
          .pp-head { margin-bottom: 10px; }
          .pp-title {
            font-size: 28px;
            line-height: 1.05;
            letter-spacing: -0.01em;
            margin: 6px 0 0;
          }
          .pp-empty {
            font-size: 13.5px;
            color: var(--ink-3);
            line-height: 1.55;
            margin: 0;
          }
        `}</style>
      </section>
    );
  }

  return (
    <section className="pp-root">
      <header className="pp-head">
        <div className="micro">Preferences · read-only</div>
        <h3 className="serif-italic pp-title">How she shops</h3>
      </header>

      <div className="pp-grid">
        <div className="pp-block pp-block-brands">
          <div className="pp-label">Brands</div>
          <div className="pp-brands">
            {prefs.brands.map((b) => (
              <span key={b} className="pp-brand">
                {b}
              </span>
            ))}
          </div>
        </div>

        <div className="pp-block pp-block-sizes">
          <div className="pp-label">Sizes</div>
          <div className="pp-sizes">
            <div className="pp-size">
              <div className="pp-size-k">Top</div>
              <div className="serif pp-size-v">{prefs.sizes.top}</div>
            </div>
            <div className="pp-size">
              <div className="pp-size-k">Bottom</div>
              <div className="serif pp-size-v">{prefs.sizes.bottom}</div>
            </div>
            <div className="pp-size">
              <div className="pp-size-k">Shoe</div>
              <div className="serif pp-size-v">{prefs.sizes.shoe}</div>
            </div>
          </div>
        </div>

        <div className="pp-block pp-block-budget">
          <div className="pp-label">Budget</div>
          <div className="pp-budget">{prefs.budget}</div>
        </div>

        <div className="pp-block pp-block-aesthetic">
          <div className="pp-label">Aesthetic</div>
          <p className="pp-aesthetic">{prefs.aesthetic}</p>
        </div>

        <div className="pp-block pp-block-rule">
          <div className="pp-label">Sourcing rule</div>
          <div className={`pp-rule ${prefs.resaleFirst ? 'pp-rule-on' : 'pp-rule-off'}`}>
            <span className="pp-rule-dot" aria-hidden="true" />
            {prefs.resaleFirst
              ? 'Resale-first — retail only if nothing ships in time.'
              : 'Open to retail — resale when the piece calls for it.'}
          </div>
        </div>
      </div>

      <style jsx>{`
        .pp-root {
          background: var(--card);
          border-radius: var(--radius-lg);
          padding: 26px 28px 28px;
          box-shadow: var(--shadow-sm);
        }

        .pp-head { margin-bottom: 22px; }
        .pp-title {
          font-size: 30px;
          line-height: 1.02;
          letter-spacing: -0.01em;
          margin: 6px 0 0;
        }

        .pp-grid {
          display: grid;
          grid-template-columns: repeat(6, 1fr);
          gap: 20px 24px;
        }
        .pp-block-brands { grid-column: span 6; }
        .pp-block-sizes { grid-column: span 6; }
        .pp-block-budget { grid-column: span 6; }
        .pp-block-aesthetic { grid-column: span 6; }
        .pp-block-rule { grid-column: span 6; }

        @media (min-width: 720px) {
          .pp-block-sizes { grid-column: span 3; }
          .pp-block-budget { grid-column: span 3; }
        }

        .pp-label {
          font-size: 10px;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          font-weight: 500;
          color: var(--ink-3);
          margin-bottom: 10px;
        }

        .pp-brands {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
        }
        .pp-brand {
          padding: 5px 11px;
          border-radius: 999px;
          background: var(--bg-sub);
          border: 1px solid var(--line);
          font-size: 12px;
          color: var(--ink-2);
          letter-spacing: 0.01em;
        }

        .pp-sizes {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 4px;
          padding: 10px 0 2px;
        }
        .pp-size {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }
        .pp-size-k {
          font-size: 10px;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: var(--ink-4);
        }
        .pp-size-v {
          font-size: 22px;
          line-height: 1.1;
          color: var(--ink);
        }

        .pp-budget {
          font-size: 13.5px;
          line-height: 1.55;
          color: var(--ink);
        }

        .pp-aesthetic {
          font-size: 14px;
          line-height: 1.6;
          color: var(--ink-2);
          margin: 0;
          max-width: 56ch;
        }

        .pp-rule {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          padding: 8px 14px 8px 12px;
          border-radius: 999px;
          font-size: 12.5px;
          line-height: 1.3;
          border: 1px solid var(--line);
        }
        .pp-rule-on {
          background: var(--sage-soft);
          color: var(--ink);
          border-color: rgba(122,132,113,0.28);
        }
        .pp-rule-off {
          background: var(--bg-sub);
          color: var(--ink-2);
        }
        .pp-rule-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: var(--ink-3);
        }
        .pp-rule-on .pp-rule-dot {
          background: var(--sage);
          box-shadow: 0 0 0 2px rgba(122,132,113,0.2);
        }
      `}</style>
    </section>
  );
}
