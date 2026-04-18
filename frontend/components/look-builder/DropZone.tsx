'use client';

import Image from 'next/image';
import { useDroppable } from '@dnd-kit/core';
import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';
import type { Garment, SlotId } from '@/lib/types';
import { useLookBuilder } from '@/stores/useLookBuilder';
import { cn } from '@/lib/utils';

type Anchor = {
  leftPct: number;
  topPct: number;
  widthPct: number;
  heightPct: number;
};

type Props = {
  slotId: SlotId;
  anchor: Anchor;
  occupant: Garment | null;
  onRemove: () => void;
};

export function DropZone({ slotId, anchor, occupant, onRemove }: Props) {
  const { isOver, setNodeRef } = useDroppable({ id: slotId });
  const draggingGarmentId = useLookBuilder((s) => s.draggingGarmentId);
  const isDragActive = draggingGarmentId !== null;

  return (
    <div
      ref={setNodeRef}
      className={cn(
        'absolute flex items-center justify-center rounded-md transition-colors duration-200 ease-editorial',
        'overflow-visible',
      )}
      style={{
        left: `${anchor.leftPct}%`,
        top: `${anchor.topPct}%`,
        width: `${anchor.widthPct}%`,
        height: `${anchor.heightPct}%`,
        transform: 'translate(-50%, -50%)',
      }}
    >
      {/* glow pulse while hovering */}
      <AnimatePresence>
        {isOver && (
          <motion.div
            key="glow"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{
              opacity: [0.4, 0.7, 0.4],
              scale: [1, 1.08, 1],
            }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{
              duration: 1.6,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
            className="pointer-events-none absolute inset-0 rounded-md bg-accent-sage/40"
          />
        )}
      </AnimatePresence>

      {/* base border — dashed when dragging, faint when idle */}
      {!occupant && (
        <div
          className={cn(
            'pointer-events-none absolute inset-0 rounded-md transition-all duration-200 ease-editorial',
            isOver
              ? 'ring-2 ring-accent-purple ring-offset-2 ring-offset-bg-primary'
              : isDragActive
                ? 'border-2 border-dashed border-line-visible'
                : 'border border-line-subtle',
          )}
        />
      )}

      {/* empty-state slot label */}
      {!occupant && !isDragActive && (
        <span className="pointer-events-none font-mono text-[10px] uppercase tracking-[0.18em] text-ink-disabled">
          {slotId}
        </span>
      )}

      {/* occupant */}
      <AnimatePresence>
        {occupant && (
          <motion.div
            key={occupant.id}
            layout
            initial={{ scale: 0.6, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            className={cn(
              'relative h-full w-full overflow-hidden rounded-md border border-line-visible bg-bg-secondary shadow-[0_8px_24px_-12px_rgba(0,0,0,0.35)]',
              isOver && 'ring-2 ring-accent-purple',
            )}
          >
            <Image
              src={occupant.imageUrl}
              alt={occupant.name}
              fill
              sizes="240px"
              className="object-cover"
              unoptimized
            />
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onRemove();
              }}
              aria-label={`Remove ${occupant.name}`}
              className="absolute right-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-bg-primary/95 text-ink shadow-md transition-transform duration-150 ease-editorial hover:scale-110"
            >
              <X className="h-3.5 w-3.5" strokeWidth={1.5} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
