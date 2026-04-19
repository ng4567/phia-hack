// Chat store for the two-sided stylist <> client app.
//
// Persisted under localStorage key `phia-chat-v1`. Cross-window sync is
// wired by `lib/chatSync.ts` via the `storage` event and calls
// `useChatStore.persist.rehydrate()` when another tab writes.
//
// On first hydration (empty store), we seed from `seed-chat.json` so the
// demo never boots into a blank thread.

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import seedChatRaw from './mock/seed-chat.json';
import type { ChatMessage, ChatMessageSender, ChatMessageKind } from './mock/types';

// ── helpers ────────────────────────────────────────────────────────────────

function newId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  // Stable fallback for unusual runtimes (e.g. Node during SSR build step).
  return (
    'msg-' +
    Date.now().toString(36) +
    '-' +
    Math.random().toString(36).slice(2, 10)
  );
}

const seedChat = seedChatRaw as Record<string, ChatMessage[]>;

// ── store shape ────────────────────────────────────────────────────────────

export interface ChatState {
  messagesByThread: Record<string, ChatMessage[]>;
  postMessage: (
    msg: Omit<ChatMessage, 'id' | 'createdAt'> & {
      sender: ChatMessageSender;
      kind: ChatMessageKind;
    },
  ) => ChatMessage;
  getThread: (threadId: string) => ChatMessage[];
  clearThread: (threadId: string) => void;
}

// ── store ──────────────────────────────────────────────────────────────────

export const useChatStore = create<ChatState>()(
  persist(
    (set, get) => ({
      messagesByThread: {},

      postMessage: (msg) => {
        const full: ChatMessage = {
          ...msg,
          id: newId(),
          createdAt: new Date().toISOString(),
        };
        set((state) => {
          const existing = state.messagesByThread[full.threadId] ?? [];
          return {
            messagesByThread: {
              ...state.messagesByThread,
              [full.threadId]: [...existing, full],
            },
          };
        });
        return full;
      },

      getThread: (threadId) => {
        return get().messagesByThread[threadId] ?? [];
      },

      clearThread: (threadId) => {
        set((state) => {
          const next = { ...state.messagesByThread };
          delete next[threadId];
          return { messagesByThread: next };
        });
      },
    }),
    {
      name: 'phia-chat-v1',
      // On first boot — or when localStorage is wiped — seed the threads
      // so the demo opens with a short, already-flowing conversation.
      onRehydrateStorage: () => (state) => {
        if (!state) return;
        if (Object.keys(state.messagesByThread).length === 0) {
          state.messagesByThread = structuredClone(seedChat);
        }
      },
    },
  ),
);

// Convenience — derive the threadId from (clientId, stylistHandle).
// Canonical format: `${clientId}-${stylistHandle}`, e.g. `sarah-@jess.styles`.
export function threadIdFor(clientId: string, stylistHandle: string): string {
  return `${clientId}-${stylistHandle}`;
}
