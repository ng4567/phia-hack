// Integrations store — tracks which of the client's "connected" services
// are active (Gmail, Google Calendar, Outlook). Persisted to localStorage
// under `phia-connected-v1` so that disconnecting on the settings page
// survives a reload and shows up immediately on the home dashboard via
// the shared store.
//
// All three integrations default to true so the demo boots with
// everything wired up — the dashboard shows live counts, the settings
// page shows "Connected" chips. The user flips individual flags via the
// Disconnect / Reconnect control on IntegrationRow.

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type IntegrationKey = 'gmail' | 'googleCalendar' | 'outlook';

export interface IntegrationsState {
  gmail: boolean;
  googleCalendar: boolean;
  outlook: boolean;
  setConnected: (key: IntegrationKey, value: boolean) => void;
  toggle: (key: IntegrationKey) => void;
}

export const useIntegrationsStore = create<IntegrationsState>()(
  persist(
    (set) => ({
      gmail: true,
      googleCalendar: true,
      outlook: true,
      setConnected: (key, value) => set({ [key]: value } as Partial<IntegrationsState>),
      toggle: (key) =>
        set((state) => ({ [key]: !state[key] } as Partial<IntegrationsState>)),
    }),
    {
      name: 'phia-connected-v1',
    },
  ),
);
