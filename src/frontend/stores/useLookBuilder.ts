'use client';

import { create } from 'zustand';
import type { Garment, SlotId } from '@/lib/types';

type Slots = Record<SlotId, Garment | null>;

const emptySlots = (): Slots => ({
  head: null,
  top: null,
  bottom: null,
  feet: null,
  accessory: null,
});

type LookBuilderState = {
  occasion: string;
  slots: Slots;
  draggingGarmentId: string | null;
  setOccasion: (v: string) => void;
  setDragging: (id: string | null) => void;
  place: (slot: SlotId, garment: Garment) => void;
  remove: (slot: SlotId) => void;
  reset: () => void;
  filledCount: () => number;
};

export const useLookBuilder = create<LookBuilderState>((set, get) => ({
  occasion: 'rooftop engagement party',
  slots: emptySlots(),
  draggingGarmentId: null,
  setOccasion: (v) => set({ occasion: v }),
  setDragging: (id) => set({ draggingGarmentId: id }),
  place: (slot, garment) =>
    set((s) => ({ slots: { ...s.slots, [slot]: garment }, draggingGarmentId: null })),
  remove: (slot) => set((s) => ({ slots: { ...s.slots, [slot]: null } })),
  reset: () => set({ slots: emptySlots(), draggingGarmentId: null }),
  filledCount: () => {
    const s = get().slots;
    return Object.values(s).filter(Boolean).length;
  },
}));

// Map each garment category to the slot it should snap to.
export function slotForCategory(category: Garment['category']): SlotId {
  switch (category) {
    case 'top':
    case 'outerwear':
      return 'top';
    case 'bottom':
      return 'bottom';
    case 'one-piece':
      return 'top'; // one-piece dresses fill the torso; legs are implied
    case 'shoes':
      return 'feet';
    case 'accessory':
    default:
      return 'accessory';
  }
}
