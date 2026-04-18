'use client';

import Link from 'next/link';
import Image from 'next/image';
import { stylist } from '@/lib/mock-data';

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-bg-primary">
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-line-subtle bg-bg-primary/85 px-10 py-5 backdrop-blur">
        <Link
          href="/"
          className="flex items-baseline gap-2 font-display text-2xl font-light tracking-tight text-ink-primary"
        >
          <span>phia</span>
          <span className="font-mono text-[11px] uppercase tracking-[0.16em] text-ink-muted">
            for stylists
          </span>
        </Link>
        <div className="flex items-center gap-4">
          <span className="font-mono text-[11px] uppercase tracking-[0.16em] text-ink-muted">
            {stylist.handle}
          </span>
          <div className="h-9 w-9 overflow-hidden rounded-full border border-line-visible">
            <Image
              src={stylist.avatarUrl}
              alt={stylist.name}
              width={36}
              height={36}
              className="h-full w-full object-cover"
              unoptimized
            />
          </div>
        </div>
      </header>
      {children}
    </div>
  );
}
