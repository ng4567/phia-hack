'use client';

// TopBarFrame — conditional TopBar wrapper used in layout.tsx.
// Lives in its own client component so layout.tsx can stay a server
// component and keep exporting `metadata`.

import { usePathname } from 'next/navigation';
import { TopBar } from './TopBar';
import { Icon } from './Icon';

export function TopBarFrame({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() || '';
  const isClientFacing = /^\/looks\/[^/]+\/view\/?$/.test(pathname);

  return (
    <>
      {!isClientFacing && <TopBar />}
      {children}
      {!isClientFacing && (
        <div className="chat-bubble" title="Help">
          <Icon.spark />
        </div>
      )}
    </>
  );
}
