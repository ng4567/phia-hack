// Stylist inbox read-state store.
//
// Tracks, per clientId, the ISO timestamp of the most recent message the
// stylist has "seen" (i.e. opened that client's detail page after). When
// compared against the latest createdAt of client-sent messages in
// useChatStore, this drives the "unread" dot on the inbox list and the
// aggregate "Inbox (N new)" header count.
//
// Persisted to localStorage under `phia-inbox-v1`. Lives alongside the
// chat store but keeps read state out of the chat data itself (which is
// shared across windows, including the customer app, and shouldn't be
// mutated by the stylist merely opening a tab).
//
// API — keep small on purpose:
//   - lastSeenAt[clientId]  — most recent seen ISO timestamp.
//   - markSeen(clientId, iso?)  — bump the timestamp.
//   - unreadCountFor(clientId, messages)  — count messages from the
//     client that arrived strictly after lastSeenAt[clientId].

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import type { ChatMessage } from './mock/types';

export interface InboxState {
  lastSeenAt: Record<string, string>;
  markSeen: (clientId: string, iso?: string) => void;
  unreadCountFor: (clientId: string, messages: ChatMessage[]) => number;
}

export const useInboxStore = create<InboxState>()(
  persist(
    (set, get) => ({
      lastSeenAt: {},

      markSeen: (clientId, iso) => {
        const stamp = iso ?? new Date().toISOString();
        set((state) => ({
          lastSeenAt: { ...state.lastSeenAt, [clientId]: stamp },
        }));
      },

      unreadCountFor: (clientId, messages) => {
        const since = get().lastSeenAt[clientId];
        if (!since) {
          return messages.filter((m) => m.sender === 'client').length;
        }
        return messages.filter(
          (m) => m.sender === 'client' && m.createdAt > since,
        ).length;
      },
    }),
    {
      name: 'phia-inbox-v1',
    },
  ),
);
