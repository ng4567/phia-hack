// Cross-window chat sync via the `storage` event.
//
// Mount this once (we do it from a client-component wrapper in app/layout.tsx).
// When another same-origin tab writes to localStorage key `phia-chat-v1`,
// we trigger `useChatStore.persist.rehydrate()` so this tab re-reads the
// freshly-written state and re-renders any components subscribed to it.

import { useChatStore } from './chatStore';

const STORAGE_KEY = 'phia-chat-v1';

// Module-level guard so repeated React StrictMode mounts or multiple
// provider instances never attach duplicate listeners.
let initialized = false;

export function initChatSync(): void {
  if (typeof window === 'undefined') return;
  if (initialized) return;
  initialized = true;

  window.addEventListener('storage', (e: StorageEvent) => {
    if (e.key !== STORAGE_KEY) return;
    // Other tab wrote to our persist key — pull the new state in.
    void useChatStore.persist.rehydrate();
  });
}
