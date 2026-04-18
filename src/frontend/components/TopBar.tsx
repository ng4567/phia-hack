'use client';

// TopBar — top navigation for the stylist app.
// Ported from shared.jsx lines 47–75.
// In the Next port, `active` and `client` are derived from the URL
// (usePathname / useParams) rather than passed as props.

import { useRouter, usePathname, useParams } from 'next/navigation';
import { MOCK, getClient, getLook, type Client } from '@/lib/mock';
import { Icon } from './Icon';

type ActiveTab = 'dashboard' | 'library' | 'inbox' | 'portfolio' | null;

function deriveActive(pathname: string): ActiveTab {
  if (pathname === '/dashboard' || pathname.startsWith('/clients/')) return 'dashboard';
  if (pathname.startsWith('/library')) return 'library';
  if (pathname.startsWith('/inbox')) return 'inbox';
  if (pathname.startsWith('/portfolio')) return 'portfolio';
  return null;
}

export function TopBar() {
  const router = useRouter();
  const pathname = usePathname() || '';
  const params = useParams() as { id?: string };

  const active = deriveActive(pathname);

  let client: Client | undefined;
  if (pathname.startsWith('/clients/') && params.id) {
    client = getClient(params.id);
  } else if (pathname.startsWith('/looks/') && params.id) {
    const look = getLook(params.id);
    if (look) client = getClient(look.clientId);
  }

  const go = (path: string) => router.push(path);

  return (
    <header className="topbar">
      <div className="topbar-inner">
        <div className="wordmark" style={{ cursor: 'pointer' }} onClick={() => go('/dashboard')}>phia</div>
        <div className="micro" style={{ color: 'var(--ink-4)', marginLeft: 4, marginTop: 6 }}>/ for stylists</div>
        <nav className="topbar-nav">
          <a className={active === 'dashboard' ? 'active' : ''} onClick={() => go('/dashboard')}>Clients</a>
          <a className={active === 'library' ? 'active' : ''} onClick={() => go('/library')}>Library</a>
          <a className={active === 'inbox' ? 'active' : ''} onClick={() => go('/inbox')}>Inbox</a>
          <a className={active === 'portfolio' ? 'active' : ''} onClick={() => go('/portfolio')}>Portfolio</a>
        </nav>
        <div className="topbar-spacer" />
        {client && (
          <div className="row gap-8" style={{ fontSize: 12, color: 'var(--ink-3)' }}>
            <span className="micro">Styling</span>
            <span style={{ color: 'var(--ink)' }} className="serif-italic">{client.name}</span>
          </div>
        )}
        <button className="icon-btn" title="Notifications"><Icon.bell /></button>
        <div
          className="avatar"
          style={{ backgroundImage: `url(${MOCK.stylist.photoUrl})` }}
          title={MOCK.stylist.name}
        />
      </div>
      <style jsx>{`
        .icon-btn { width:36px;height:36px;border-radius:50%;display:flex;align-items:center;justify-content:center;color:var(--ink-2); }
        .icon-btn:hover { background: var(--bg-sub); }
      `}</style>
    </header>
  );
}
