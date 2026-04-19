'use client';

// ChatSyncProvider — tiny client-component wrapper so the server-rendered
// `app/layout.tsx` can attach the cross-window chat sync listener exactly
// once on mount without itself becoming a client component.

import { useEffect } from 'react';

import { initChatSync } from '@/lib/chatSync';

export function ChatSyncProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    initChatSync();
  }, []);
  return <>{children}</>;
}
