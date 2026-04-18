'use client';

import { useEffect, useMemo, useState } from 'react';
import { notFound, useParams, useRouter } from 'next/navigation';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core';
import { AnimatePresence, motion } from 'framer-motion';

import { AppShell } from '@/components/shared/AppShell';
import { OccasionBanner } from '@/components/look-builder/OccasionBanner';
import { GarmentSearch } from '@/components/look-builder/GarmentSearch';
import { Silhouette } from '@/components/look-builder/Silhouette';
import { GarmentTile } from '@/components/look-builder/GarmentTile';
import { clientById, garments, garmentById } from '@/lib/mock-data';
import { useLookBuilder } from '@/stores/useLookBuilder';
import type { Garment, SlotId } from '@/lib/types';
import { cn } from '@/lib/utils';

const SLOT_IDS: SlotId[] = ['head', 'top', 'bottom', 'feet', 'accessory'];

export default function NewLookPage() {
  const params = useParams<{ clientId: string }>();
  const clientId = params?.clientId;
  const router = useRouter();

  const client = clientId ? clientById(clientId) : undefined;

  const setDragging = useLookBuilder((s) => s.setDragging);
  const place = useLookBuilder((s) => s.place);
  const reset = useLookBuilder((s) => s.reset);
  const slots = useLookBuilder((s) => s.slots);

  const filledCount = useMemo(
    () => Object.values(slots).filter(Boolean).length,
    [slots],
  );

  const [activeGarment, setActiveGarment] = useState<Garment | null>(null);

  useEffect(() => {
    reset();
  }, [reset]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
  );

  if (!client) {
    notFound();
  }

  const firstName = client.name.split(/\s+/)[0];
  const targetLookId = client.looks[0]?.id;
  const canGenerate = filledCount >= 3 && Boolean(targetLookId);

  const handleDragStart = (event: DragStartEvent) => {
    const id = event.active.id as string;
    setDragging(id);
    const g = garmentById(id);
    setActiveGarment(g ?? null);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const overId = event.over?.id as string | undefined;
    const activeId = event.active.id as string;
    const g = garmentById(activeId);

    if (overId && g && (SLOT_IDS as string[]).includes(overId)) {
      // allow any garment to be placed into any targeted slot — stylists can
      // override the category mapping by dropping onto a different zone.
      place(overId as SlotId, g);
    }

    setDragging(null);
    setActiveGarment(null);
  };

  const handleDragCancel = () => {
    setDragging(null);
    setActiveGarment(null);
  };

  const handleGenerate = () => {
    if (!canGenerate || !targetLookId) return;
    router.push(`/clients/${client.id}/looks/${targetLookId}?generating=1`);
  };

  return (
    <AppShell>
      <DndContext
        sensors={sensors}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDragCancel={handleDragCancel}
      >
        <OccasionBanner client={client} />

        <main className="mx-auto grid max-w-[1600px] grid-cols-[minmax(0,38fr)_minmax(0,62fr)] gap-12 px-10 py-10">
          {/* LEFT — garment search */}
          <section className="flex flex-col">
            <header className="mb-5">
              <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-ink-muted">
                GARMENT LIBRARY
              </span>
              <h2 className="mt-2 font-display text-3xl font-light italic text-ink">
                build the look
              </h2>
              <p className="mt-2 font-sans text-sm text-ink-muted">
                Drag pieces onto {firstName}&rsquo;s silhouette. Any piece,
                any slot &mdash; trust your eye.
              </p>
            </header>
            <GarmentSearch garments={garments} />
          </section>

          {/* RIGHT — silhouette + generate */}
          <section className="relative flex flex-col items-center">
            <Silhouette />

            <div className="mt-4 flex items-center gap-3">
              <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-ink-muted">
                {client.name.toUpperCase()} &middot; {filledCount}/5 PIECES PLACED
              </span>
            </div>

            <div className="mt-6 flex items-center gap-4">
              <motion.button
                type="button"
                onClick={handleGenerate}
                disabled={!canGenerate}
                animate={
                  canGenerate
                    ? { scale: [1, 1.04, 1] }
                    : { scale: 1 }
                }
                transition={
                  canGenerate
                    ? { duration: 1.8, repeat: Infinity, ease: 'easeInOut' }
                    : { duration: 0.2 }
                }
                whileHover={canGenerate ? { y: -2 } : undefined}
                whileTap={canGenerate ? { scale: 0.98 } : undefined}
                className={cn(
                  'inline-flex items-center justify-center gap-2 rounded-full border px-9 py-4 font-sans text-[15px] font-medium transition-colors duration-200 ease-editorial',
                  canGenerate
                    ? 'border-accent-purple bg-accent-purple text-white hover:bg-[#4a256a]'
                    : 'cursor-not-allowed border-line-visible bg-bg-tertiary text-ink-disabled',
                )}
              >
                Generate Try-On
                <span aria-hidden>&rarr;</span>
              </motion.button>
            </div>

            {!canGenerate && (
              <p className="mt-3 font-mono text-[10px] uppercase tracking-[0.18em] text-ink-muted">
                PLACE AT LEAST 3 PIECES TO GENERATE
              </p>
            )}
          </section>
        </main>

        <DragOverlay dropAnimation={null}>
          <AnimatePresence>
            {activeGarment && (
              <motion.div
                initial={{ scale: 0.9, opacity: 0.9 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                className="w-44"
              >
                <GarmentTile garment={activeGarment} overlay />
              </motion.div>
            )}
          </AnimatePresence>
        </DragOverlay>
      </DndContext>
    </AppShell>
  );
}
