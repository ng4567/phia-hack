'use client';

// Public stylist portfolio — phia.com/stylists/jess.
// Port of portfolio.jsx:1–154. Cover hero, stats bar, about, featured looks,
// testimonials, CTA. Router replaces onNav('look', { lookId }) for featured
// look clicks. Cover "Book a session" / "View rates" buttons are inert per spec.

import { useRouter } from 'next/navigation';
import { SavingsBadge } from '@/components/SavingsBadge';
import { Quote } from '@/components/portfolio/Quote';
import { getClient, lookTotals, MOCK, type Look } from '@/lib/mock';
import { cx, fmt } from '@/lib/utils';

type FeaturedLook = Look & { _client: string };

export default function StylistPortfolio() {
  const router = useRouter();
  const allLooks: FeaturedLook[] = [
    ...MOCK.looks.sarah.map((l) => ({ ...l, _client: 'sarah' })),
    ...MOCK.looks.maya.map((l) => ({ ...l, _client: 'maya' })),
  ];
  const featured = allLooks.slice(0, 6);

  return (
    <div className="screen portfolio" data-screen-label="Portfolio">
      {/* Cover */}
      <section className="pf-cover">
        <div className="pf-cover-img" style={{ backgroundImage: `url(https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=1800&h=900&fit=crop)` }} />
        <div className="pf-cover-overlay" />
        <div className="pf-cover-content">
          <div className="micro" style={{ color: 'rgba(255,255,255,.7)' }}>Personal stylist · Brooklyn</div>
          <h1 className="serif-italic pf-name">Jess Martell</h1>
          <div className="pf-tagline">Quiet, considered wardrobes built around your actual life — priced by phia.</div>
          <div className="row gap-12" style={{ marginTop: 28 }}>
            <button className="btn btn-primary" style={{ background: '#fff', color: 'var(--ink)' }}>Book a session</button>
            <button className="btn btn-ghost" style={{ background: 'rgba(255,255,255,0.12)', color: '#fff', borderColor: 'rgba(255,255,255,0.3)' }}>View rates</button>
          </div>
        </div>
      </section>

      <div className="pf-shell">
        {/* Stats bar */}
        <section className="pf-stats">
          <div><div className="serif pf-stat">148</div><div className="micro">Looks built</div></div>
          <div><div className="serif pf-stat">32</div><div className="micro">Active clients</div></div>
          <div><div className="serif pf-stat" style={{ color: 'var(--accent)' }}>$38k</div><div className="micro">Saved via phia</div></div>
          <div><div className="serif pf-stat" style={{ color: 'var(--sage)' }}>62%</div><div className="micro">Avg. off retail</div></div>
          <div><div className="serif pf-stat">4.97</div><div className="micro">Client rating</div></div>
        </section>

        {/* About */}
        <section className="pf-about">
          <div className="col gap-8">
            <div className="micro">The approach</div>
            <h2 className="serif-italic pf-h2">I build wardrobes you actually wear.</h2>
          </div>
          <div className="col gap-16" style={{ maxWidth: 620, fontSize: 15, lineHeight: 1.7, color: 'var(--ink-2)' }}>
            <p style={{ margin: 0 }}>I spent seven years at the shoot-side of fashion — Vogue, Elle, a year at The Row — and the one thing that stayed with me: the best outfits are never loud. They fit the room, the weather, the week you&apos;re having.</p>
            <p style={{ margin: 0 }}>Every piece I propose is cross-checked with phia against 40,000+ retail and resale sources. You see the look on your body before you commit a dollar, and you rarely pay retail.</p>
          </div>
        </section>

        {/* Featured looks */}
        <section style={{ marginTop: 72 }}>
          <div className="section-head">
            <div>
              <div className="micro">Recent work</div>
              <h2 className="serif pf-h2" style={{ fontSize: 40, marginTop: 8 }}>Selected looks</h2>
            </div>
            <a className="micro" style={{ cursor: 'pointer' }}>Browse all →</a>
          </div>
          <div className="pf-looks">
            {featured.map((l, i) => {
              const c = getClient(l._client);
              if (!c) return null;
              const t = lookTotals(l);
              const big = i === 0 || i === 3;
              return (
                <div key={l.id} className={cx('pf-look', big && 'pf-look-big')} onClick={() => router.push(`/looks/${l.id}`)}>
                  <div className="pfl-img" style={{ backgroundImage: `url(${l.coverUrl})` }}>
                    <span className="pfl-chip">{c.name.split(' ')[0]}</span>
                  </div>
                  <div className="pfl-body">
                    <div className="serif-italic" style={{ fontSize: big ? 28 : 20, lineHeight: 1.15 }}>{l.occasion}</div>
                    <div className="row" style={{ justifyContent: 'space-between', marginTop: 8, alignItems: 'baseline' }}>
                      <div className="micro">{t.garments.length} pieces · {fmt(t.phia)}</div>
                      <SavingsBadge pct={t.savingsPct} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Testimonials */}
        <section style={{ marginTop: 88 }}>
          <div className="section-head">
            <h2 className="serif pf-h2" style={{ fontSize: 40 }}>From her clients</h2>
          </div>
          <div className="pf-quotes">
            <Quote author="Sarah C." role="Brooklyn · client since 2024"
              text="Jess built me a rooftop-party look that came in under $500 for the whole outfit. The slip dress alone retails at $300. I send her every wedding invite now." />
            <Quote author="Maya R." role="Silver Lake · client since 2023"
              text="Every look she makes feels like mine, just a version of me I didn't know how to put together. And phia's pricing is the quiet magic." />
            <Quote author="Olivia B." role="London · client since 2025"
              text="Booked her for a work trip. Two looks, five days, three cities. I wore everything. Nothing felt like styling — it felt like packing smarter." />
          </div>
        </section>

        {/* CTA */}
        <section className="pf-cta">
          <div className="col gap-6">
            <div className="micro">Accepting 4 new clients this spring</div>
            <div className="serif-italic" style={{ fontSize: 48, lineHeight: 1.05, letterSpacing: '-0.01em' }}>
              Let&apos;s build your first look.
            </div>
          </div>
          <div className="row gap-12">
            <button className="btn btn-primary">Book intake call</button>
            <button className="btn btn-ghost">Send a brief</button>
          </div>
        </section>
      </div>

      <style jsx>{`
        .pf-cover { position: relative; height: 520px; overflow: hidden; }
        .pf-cover-img { position: absolute; inset: 0; background: #222 center/cover no-repeat; transform: scale(1.02); }
        .pf-cover-overlay { position: absolute; inset: 0; background: linear-gradient(180deg, rgba(26,24,22,0.15), rgba(26,24,22,0.65)); }
        .pf-cover-content { position: absolute; left: 0; right: 0; bottom: 48px; max-width: 1440px; margin: 0 auto; padding: 0 32px; color: #fff; }
        .pf-name { font-size: 112px; line-height: 0.98; letter-spacing: -0.03em; margin: 8px 0 18px; }
        .pf-tagline { font-size: 17px; max-width: 520px; line-height: 1.5; color: rgba(255,255,255,0.88); }

        .pf-shell { max-width: 1440px; margin: 0 auto; padding: 56px 32px 80px; }

        .pf-stats { display: grid; grid-template-columns: repeat(5, 1fr); gap: 2px; background: var(--line); border-radius: var(--radius-lg); overflow: hidden; margin-bottom: 72px; }
        .pf-stats > div { background: var(--card); padding: 22px 24px; }
        .pf-stat { font-size: 36px; line-height: 1; margin-bottom: 8px; letter-spacing: -0.01em; }

        .pf-about { display: grid; grid-template-columns: 1fr 1fr; gap: 72px; align-items: flex-start; }
        .pf-h2 { font-size: 52px; line-height: 1.05; letter-spacing: -0.02em; margin: 0; }

        .pf-looks { display: grid; grid-template-columns: repeat(6, 1fr); gap: 20px; }
        .pf-look { grid-column: span 2; cursor: pointer; }
        .pf-look-big { grid-column: span 3; }
        .pfl-img { aspect-ratio: 3/4; background: var(--bg-sub) center/cover no-repeat; border-radius: var(--radius); position: relative; transition: transform .2s ease; }
        .pf-look-big .pfl-img { aspect-ratio: 4/4.5; }
        .pf-look:hover .pfl-img { transform: translateY(-3px); }
        .pfl-chip { position: absolute; top: 12px; left: 12px; background: rgba(255,255,255,.92); padding: 3px 9px; border-radius: 999px; font-size: 10px; letter-spacing: .08em; text-transform: uppercase; }
        .pfl-body { padding: 12px 2px 2px; }

        .pf-quotes { display: grid; grid-template-columns: repeat(3, 1fr); gap: 32px; }

        .pf-cta { margin-top: 96px; padding: 48px 56px; background: var(--card); border-radius: var(--radius-xl); box-shadow: var(--shadow-sm); display: flex; align-items: center; justify-content: space-between; gap: 32px; flex-wrap: wrap; }

        .section-head { display: flex; align-items: baseline; justify-content: space-between; margin-bottom: 28px; }

        @media (max-width: 1100px) {
          .pf-name { font-size: 72px; }
          .pf-about { grid-template-columns: 1fr; gap: 24px; }
          .pf-stats { grid-template-columns: repeat(2, 1fr); }
          .pf-looks { grid-template-columns: repeat(2, 1fr); }
          .pf-look, .pf-look-big { grid-column: span 1; }
          .pf-quotes { grid-template-columns: 1fr; }
        }
      `}</style>
    </div>
  );
}
