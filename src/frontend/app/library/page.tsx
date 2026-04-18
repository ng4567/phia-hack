'use client';

// Library — stylist's full garment catalog / inventory.
// Port of library.jsx:1–136. Search / category / sort / grid-vs-list view
// are all local state; no router needed (all clicks are internal).

import { useState } from 'react';
import { Icon } from '@/components/Icon';
import { SavingsBadge } from '@/components/SavingsBadge';
import { MOCK } from '@/lib/mock';
import { cx, fmt } from '@/lib/utils';

export default function Library() {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [sort, setSort] = useState('savings');
  const [view, setView] = useState('grid');

  const cats = ['all', 'top', 'bottom', 'one-piece', 'outerwear', 'shoes', 'accessory'];

  let items = MOCK.garments.filter((g) => {
    if (category !== 'all' && g.category !== category) return false;
    if (search && !(`${g.brand} ${g.name}`.toLowerCase().includes(search.toLowerCase()))) return false;
    return true;
  });
  if (sort === 'savings') items = [...items].sort((a, b) => b.phia.savings - a.phia.savings);
  if (sort === 'price') items = [...items].sort((a, b) => a.phia.lowest - b.phia.lowest);
  if (sort === 'retail') items = [...items].sort((a, b) => b.retailPrice - a.retailPrice);

  const totalPieces = MOCK.garments.length;
  const avgSavings = Math.round(MOCK.garments.reduce((s, g) => s + g.phia.savings, 0) / totalPieces);

  return (
    <div className="screen lib" data-screen-label="Library">
      <div className="page-inner">
        <section className="lib-hero">
          <div>
            <div className="micro">Your library</div>
            <h1 className="serif-italic lib-title">Pieces you style with.</h1>
            <p className="lib-sub">Every item cross-referenced with phia. Drag any piece onto a client&apos;s board, or paste a new URL to add.</p>
          </div>
          <div className="lib-stats">
            <div><div className="serif lib-num">{totalPieces}</div><div className="micro">Pieces</div></div>
            <div><div className="serif lib-num">{avgSavings}%</div><div className="micro">Avg. savings</div></div>
            <div><div className="serif lib-num">40k+</div><div className="micro">Resale sources</div></div>
          </div>
        </section>

        <div className="lib-controls">
          <div className="lib-search">
            <Icon.search />
            <input placeholder="Search or paste a product URL to add" value={search} onChange={e => setSearch(e.target.value)} />
            <button className="btn btn-primary" style={{ padding: '7px 14px', fontSize: 12 }}><Icon.plus /> Add piece</button>
          </div>
          <div className="row gap-6" style={{ flexWrap: 'wrap' }}>
            {cats.map(c => (
              <button key={c} className={cx('pill', category === c && 'active')} onClick={() => setCategory(c)} style={{ textTransform: 'capitalize' }}>
                {c === 'all' ? 'All pieces' : c}
              </button>
            ))}
          </div>
          <div className="row gap-8">
            <select className="lib-sort" value={sort} onChange={e => setSort(e.target.value)}>
              <option value="savings">Sort · Biggest savings</option>
              <option value="price">Sort · Lowest phia price</option>
              <option value="retail">Sort · Highest retail</option>
            </select>
            <button className={cx('pill', view === 'grid' && 'active')} onClick={() => setView('grid')}><Icon.grid /></button>
            <button className={cx('pill', view === 'list' && 'active')} onClick={() => setView('list')}><Icon.filter /></button>
          </div>
        </div>

        {view === 'grid' ? (
          <div className="lib-grid">
            {items.map(g => (
              <div key={g.id} className="lib-tile">
                <div className="lt-img" style={{ backgroundImage: `url(${g.imageUrl})` }}>
                  <div className="lt-save"><SavingsBadge pct={g.phia.savings} /></div>
                  <button className="lt-book" title="Save"><Icon.bookmark /></button>
                </div>
                <div className="lt-body">
                  <div className="micro">{g.brand}</div>
                  <div style={{ fontSize: 13.5, lineHeight: 1.3, marginTop: 3 }}>{g.name}</div>
                  <div className="row gap-8" style={{ alignItems: 'baseline', marginTop: 6 }}>
                    <span style={{ fontSize: 14, fontWeight: 500 }}>{fmt(g.phia.lowest)}</span>
                    <span className="strike" style={{ fontSize: 11 }}>{fmt(g.retailPrice)}</span>
                  </div>
                  <div className="micro" style={{ fontSize: 10, marginTop: 4 }}>via {g.phia.source} · {g.phia.condition}</div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="lib-list">
            {items.map(g => (
              <div key={g.id} className="ll-row">
                <div className="ll-img" style={{ backgroundImage: `url(${g.imageUrl})` }} />
                <div className="col" style={{ flex: 1 }}>
                  <div className="micro">{g.brand} · <span style={{ textTransform: 'capitalize' }}>{g.category}</span></div>
                  <div className="serif" style={{ fontSize: 17, lineHeight: 1.2, marginTop: 3 }}>{g.name}</div>
                  <div className="micro" style={{ fontSize: 10, marginTop: 4 }}>via {g.phia.source} · {g.phia.condition}</div>
                </div>
                <div className="col" style={{ alignItems: 'flex-end', minWidth: 140 }}>
                  <div className="row gap-8" style={{ alignItems: 'baseline' }}>
                    <span className="serif" style={{ fontSize: 18 }}>{fmt(g.phia.lowest)}</span>
                    <span className="strike" style={{ fontSize: 11 }}>{fmt(g.retailPrice)}</span>
                  </div>
                  <SavingsBadge pct={g.phia.savings} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <style jsx>{`
        .page-inner { max-width: 1440px; margin: 0 auto; padding: 40px 32px 80px; }
        .lib-hero { display: flex; align-items: flex-end; justify-content: space-between; gap: 48px; margin-bottom: 36px; }
        .lib-title { font-size: 64px; line-height: 1; margin: 12px 0 14px; letter-spacing: -0.02em; }
        .lib-sub { font-size: 14.5px; color: var(--ink-2); max-width: 520px; line-height: 1.55; margin: 0; }
        .lib-stats { display: flex; gap: 48px; }
        .lib-num { font-size: 36px; line-height: 1; letter-spacing: -0.01em; }

        .lib-controls { display: flex; align-items: center; gap: 18px; margin-bottom: 28px; flex-wrap: wrap; }
        .lib-search { display: flex; align-items: center; gap: 10px; padding: 6px 6px 6px 16px; background: var(--card); border-radius: 999px; border: 1px solid var(--line); min-width: 360px; flex: 1; max-width: 560px; color: var(--ink-3); }
        .lib-search input { flex: 1; border: none; background: transparent; outline: none; font-size: 13px; color: var(--ink); padding: 6px 0; }
        .lib-sort { padding: 7px 14px; border-radius: 999px; border: 1px solid var(--line); background: var(--card); font-size: 12.5px; color: var(--ink-2); }

        .lib-grid { display: grid; grid-template-columns: repeat(5, 1fr); gap: 20px; }
        .lib-tile { cursor: pointer; transition: transform .2s ease; }
        .lib-tile:hover { transform: translateY(-2px); }
        .lt-img { aspect-ratio: 3/4; background: var(--bg-sub) center/cover no-repeat; border-radius: var(--radius); position: relative; }
        .lt-save { position: absolute; bottom: 10px; left: 10px; }
        .lt-book { position: absolute; top: 10px; right: 10px; width: 28px; height: 28px; border-radius: 50%; background: rgba(255,255,255,.92); color: var(--ink-2); display: flex; align-items: center; justify-content: center; opacity: 0; transition: opacity .15s ease; }
        .lib-tile:hover .lt-book { opacity: 1; }
        .lt-body { padding: 10px 2px 2px; }

        .lib-list { display: flex; flex-direction: column; gap: 2px; background: var(--card); border-radius: var(--radius-lg); padding: 6px 20px; box-shadow: var(--shadow-sm); }
        .ll-row { display: flex; align-items: center; gap: 18px; padding: 14px 0; border-bottom: 1px solid var(--line); }
        .ll-row:last-child { border-bottom: none; }
        .ll-img { width: 64px; aspect-ratio: 3/4; background: var(--bg-sub) center/cover no-repeat; border-radius: 8px; }

        @media (max-width: 1200px) { .lib-grid { grid-template-columns: repeat(3, 1fr); } .lib-hero { flex-direction: column; align-items: flex-start; } }
      `}</style>
    </div>
  );
}
