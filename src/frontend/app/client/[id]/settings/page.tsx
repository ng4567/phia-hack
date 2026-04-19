'use client';

// Customer settings — stacked IntegrationRows (Gmail · GCal · Outlook)
// followed by a read-only Preferences panel.
//
// Integrations write through useIntegrationsStore; Preferences render
// statically from the preferences fixture keyed by client id.

import { useMemo } from 'react';
import { useParams } from 'next/navigation';

import { ClientNavTabs } from '@/components/client/ClientNavTabs';
import { IntegrationRow } from '@/components/client/IntegrationRow';
import phoebeGmail from '@/lib/mock/client-phoebe-gmail.json';
import phoebeCalendar from '@/lib/mock/client-phoebe-calendar.json';
import phoebeOutlook from '@/lib/mock/client-phoebe-outlook.json';
import phoebePrefs from '@/lib/mock/client-phoebe-preferences.json';
import sophiaGmail from '@/lib/mock/client-sophia-gmail.json';
import sophiaCalendar from '@/lib/mock/client-sophia-calendar.json';
import sophiaOutlook from '@/lib/mock/client-sophia-outlook.json';
import sophiaPrefs from '@/lib/mock/client-sophia-preferences.json';
import type {
  CalendarEvent,
  ClientPreferences,
  ClosetGarment,
  ParsedOrderEmail,
} from '@/lib/mock/types';
import { getClient } from '@/lib/mock';

interface GmailShape {
  emails: ParsedOrderEmail[];
  garments: ClosetGarment[];
}
interface EventsShape {
  events: CalendarEvent[];
}

const GMAIL: Record<string, GmailShape> = {
  sarah: phoebeGmail as GmailShape,
  maya: sophiaGmail as GmailShape,
};
const CALENDAR: Record<string, EventsShape> = {
  sarah: phoebeCalendar as EventsShape,
  maya: sophiaCalendar as EventsShape,
};
const OUTLOOK: Record<string, EventsShape> = {
  sarah: phoebeOutlook as EventsShape,
  maya: sophiaOutlook as EventsShape,
};
const PREFS: Record<string, ClientPreferences> = {
  sarah: phoebePrefs as ClientPreferences,
  maya: sophiaPrefs as ClientPreferences,
};

function nextEventTitle(events: CalendarEvent[]): string {
  if (!events.length) return 'nothing scheduled';
  const now = Date.now();
  const upcoming = events
    .filter((e) => new Date(e.start).getTime() >= now - 3_600_000)
    .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());
  return (upcoming[0] ?? events[0]).title;
}

export default function ClientSettingsPage() {
  const { id } = useParams<{ id: string }>();
  const client = getClient(id);

  const gmail = GMAIL[id];
  const cal = CALENDAR[id];
  const out = OUTLOOK[id];
  const prefs = PREFS[id];

  const gmailEmailCount = gmail?.emails?.length ?? 0;
  const gmailGarmentCount = gmail?.garments?.length ?? 0;
  const calCount = cal?.events?.length ?? 0;
  const outCount = out?.events?.length ?? 0;

  const calNextTitle = useMemo(() => nextEventTitle(cal?.events ?? []), [cal]);
  const outNextTitle = useMemo(() => nextEventTitle(out?.events ?? []), [out]);

  if (!client) return null;

  const firstName = client.name.split(' ')[0];
  const gmailAccount =
    id === 'sarah' ? 'phoebe.gates@gmail.com' : 'sophia.kianni@gmail.com';
  const outlookAccount =
    id === 'sarah'
      ? 'phoebe@editorialcollective.co'
      : 'sophia@climatecolab.org';

  return (
    <>
      <ClientNavTabs clientId={id} />

      <main className="screen settings-page" data-screen-label="Client · Settings">
        <div className="settings-shell">
          <section className="hero">
            <div className="micro">Settings</div>
            <h1 className="serif-italic hero-title">
              {firstName}&rsquo;s account.
            </h1>
            <p className="hero-sub">
              Tune what Jess can see. Toggling an integration off pauses new
              syncs — nothing already parsed is deleted.
            </p>
          </section>

          <section className="section">
            <div className="section-head">
              <div className="section-title-block">
                <div className="micro">Connected signals</div>
                <h2 className="serif section-title">Integrations</h2>
              </div>
              <div className="sync-meta">
                <span className="sync-dot" />
                Auto-sync every 10 minutes
              </div>
            </div>

            <div className="rows">
              <IntegrationRow
                integrationKey="gmail"
                title="Gmail"
                accountEmail={gmailAccount}
                primaryMetric={`${gmailEmailCount} order emails parsed · ${gmailGarmentCount} garments found`}
                secondaryMetric={`Retailers: Reformation, Cecilie Bahnsen, Miu Miu, Chloé${
                  id === 'maya' ? ' (+3)' : ' (+5)'
                }`}
                lastSyncMinutesAgo={2}
              />
              <IntegrationRow
                integrationKey="googleCalendar"
                title="Google Calendar"
                accountEmail={gmailAccount}
                primaryMetric={`${calCount} upcoming events`}
                secondaryMetric={
                  calNextTitle ? `Next: ${calNextTitle}` : undefined
                }
                lastSyncMinutesAgo={2}
              />
              <IntegrationRow
                integrationKey="outlook"
                title="Outlook"
                accountEmail={outlookAccount}
                primaryMetric={`${outCount} work event${outCount === 1 ? '' : 's'} this week`}
                secondaryMetric={
                  outNextTitle ? `Next: ${outNextTitle}` : undefined
                }
                lastSyncMinutesAgo={4}
              />
            </div>
          </section>

          {prefs && (
            <section className="section">
              <div className="section-head">
                <div className="section-title-block">
                  <div className="micro">How you dress</div>
                  <h2 className="serif section-title">Preferences</h2>
                </div>
                <div className="edit-hint">Read-only in this demo</div>
              </div>

              <div className="pref-grid">
                <div className="pref-card span-2">
                  <div className="pref-label">
                    <span className="micro">Aesthetic</span>
                  </div>
                  <p className="pref-aesthetic serif-italic">{prefs.aesthetic}</p>
                </div>

                <div className="pref-card">
                  <div className="pref-label">
                    <span className="micro">Brands</span>
                    <span className="pref-count">{prefs.brands.length}</span>
                  </div>
                  <div className="pref-brands">
                    {prefs.brands.map((b) => (
                      <span key={b} className="brand-chip">
                        {b}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="pref-card">
                  <div className="pref-label">
                    <span className="micro">Sizing</span>
                  </div>
                  <div className="size-grid">
                    <div className="size">
                      <div className="size-key">Top</div>
                      <div className="size-val serif">{prefs.sizes.top}</div>
                    </div>
                    <div className="size">
                      <div className="size-key">Bottom</div>
                      <div className="size-val serif">{prefs.sizes.bottom}</div>
                    </div>
                    <div className="size">
                      <div className="size-key">Shoe</div>
                      <div className="size-val serif">{prefs.sizes.shoe}</div>
                    </div>
                  </div>
                </div>

                <div className="pref-card">
                  <div className="pref-label">
                    <span className="micro">Budget</span>
                  </div>
                  <div className="pref-plain">{prefs.budget}</div>
                </div>

                <div className="pref-card">
                  <div className="pref-label">
                    <span className="micro">Resale-first rule</span>
                  </div>
                  <div className="resale-row">
                    <span
                      className={`resale-dot ${prefs.resaleFirst ? 'on' : 'off'}`}
                    />
                    <span className="resale-label">
                      {prefs.resaleFirst
                        ? 'On — always check resale before retail'
                        : 'Off — retail-first for this client'}
                    </span>
                  </div>
                </div>
              </div>
            </section>
          )}
        </div>

        <style jsx>{`
          .settings-page {
            min-height: calc(100vh - 60px);
            padding-bottom: 96px;
          }
          .settings-shell {
            max-width: 1040px;
            margin: 0 auto;
            padding: 36px 32px 0;
            display: flex;
            flex-direction: column;
            gap: 52px;
          }

          .hero {
            display: flex;
            flex-direction: column;
            gap: 10px;
            max-width: 540px;
          }
          .hero-title {
            font-size: 48px;
            line-height: 1.05;
            letter-spacing: -0.02em;
            color: var(--ink);
            margin: 4px 0 0;
          }
          .hero-sub {
            font-size: 14px;
            color: var(--ink-3);
            line-height: 1.55;
            margin: 4px 0 0;
          }

          .section {
            display: flex;
            flex-direction: column;
            gap: 18px;
          }
          .section-head {
            display: flex;
            align-items: flex-end;
            justify-content: space-between;
            gap: 18px;
          }
          .section-title-block {
            display: flex;
            flex-direction: column;
            gap: 4px;
          }
          .section-title {
            font-size: 28px;
            line-height: 1.05;
            letter-spacing: -0.01em;
            color: var(--ink);
            margin: 0;
          }
          .sync-meta {
            display: inline-flex;
            align-items: center;
            gap: 7px;
            font-size: 11px;
            letter-spacing: 0.08em;
            text-transform: uppercase;
            color: var(--ink-3);
            font-weight: 500;
          }
          .sync-dot {
            width: 6px;
            height: 6px;
            border-radius: 50%;
            background: var(--sage);
            box-shadow: 0 0 0 3px rgba(122, 132, 113, 0.18);
          }
          .edit-hint {
            font-size: 11px;
            letter-spacing: 0.08em;
            text-transform: uppercase;
            color: var(--ink-4);
            font-weight: 500;
          }

          .rows {
            display: flex;
            flex-direction: column;
            gap: 12px;
          }

          .pref-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 14px;
          }
          .pref-card {
            background: var(--card);
            border: 1px solid var(--line);
            border-radius: var(--radius-lg);
            padding: 22px 24px;
            box-shadow: var(--shadow-sm);
            display: flex;
            flex-direction: column;
            gap: 12px;
          }
          .pref-card.span-2 {
            grid-column: span 2;
          }
          .pref-label {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 8px;
          }
          .pref-count {
            font-size: 10.5px;
            letter-spacing: 0.1em;
            text-transform: uppercase;
            color: var(--ink-4);
            font-weight: 500;
            padding: 2px 8px;
            border-radius: 999px;
            background: var(--bg);
          }

          .pref-aesthetic {
            font-size: 22px;
            line-height: 1.4;
            color: var(--ink);
            margin: 0;
          }
          .pref-plain {
            font-size: 15px;
            color: var(--ink);
            line-height: 1.45;
          }

          .pref-brands {
            display: flex;
            flex-wrap: wrap;
            gap: 6px;
          }
          .brand-chip {
            padding: 5px 11px;
            border-radius: 999px;
            background: var(--bg);
            border: 1px solid var(--line);
            font-size: 11.5px;
            color: var(--ink-2);
          }

          .size-grid {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 2px;
            background: var(--line);
            border-radius: var(--radius);
            overflow: hidden;
            border: 1px solid var(--line);
          }
          .size {
            background: var(--card);
            padding: 14px 10px 12px;
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 4px;
          }
          .size-key {
            font-size: 9.5px;
            letter-spacing: 0.14em;
            text-transform: uppercase;
            color: var(--ink-3);
            font-weight: 500;
          }
          .size-val {
            font-size: 22px;
            line-height: 1;
            color: var(--ink);
            letter-spacing: -0.01em;
          }

          .resale-row {
            display: flex;
            align-items: center;
            gap: 10px;
          }
          .resale-dot {
            width: 8px;
            height: 8px;
            border-radius: 50%;
          }
          .resale-dot.on {
            background: var(--sage);
            box-shadow: 0 0 0 4px rgba(122, 132, 113, 0.18);
          }
          .resale-dot.off {
            background: var(--ink-4);
          }
          .resale-label {
            font-size: 13.5px;
            color: var(--ink);
          }

          @media (max-width: 820px) {
            .pref-grid {
              grid-template-columns: 1fr;
            }
            .pref-card.span-2 {
              grid-column: span 1;
            }
            .section-head {
              flex-direction: column;
              align-items: flex-start;
              gap: 8px;
            }
          }
          @media (max-width: 640px) {
            .settings-shell {
              padding: 28px 18px 0;
              gap: 40px;
            }
            .hero-title {
              font-size: 36px;
            }
          }
        `}</style>
      </main>
    </>
  );
}
