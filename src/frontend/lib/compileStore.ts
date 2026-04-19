// Transient "compiling dossier" state for the stylist → client navigation.
// No persistence: the store only lives across the single page transition
// from /dashboard to /clients/[id] so the overlay on the destination page
// can render the animation and then call `finish()` to clear itself.

import { create } from 'zustand';

interface CompileState {
  isCompiling: boolean;
  targetClientId: string | null;
  start: (clientId: string) => void;
  finish: () => void;
}

export const useCompileStore = create<CompileState>((set) => ({
  isCompiling: false,
  targetClientId: null,
  start: (clientId) => set({ isCompiling: true, targetClientId: clientId }),
  finish: () => set({ isCompiling: false, targetClientId: null }),
}));
