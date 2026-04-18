'use client';

import Image from 'next/image';
import { useDraggable } from '@dnd-kit/core';
import { motion } from 'framer-motion';
import type { Garment } from '@/lib/types';
import { useLookBuilder } from '@/stores/useLookBuilder';
import { cn, formatCurrency } from '@/lib/utils';

type Props = {
  garment: Garment;
  /** When true, renders a non-interactive copy suitable for DragOverlay. */
  overlay?: boolean;
};

export function GarmentTile({ garment, overlay = false }: Props) {
  if (overlay) {
    return <TileVisual garment={garment} overlay />;
  }
  return <DraggableTile garment={garment} />;
}

function DraggableTile({ garment }: { garment: Garment }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: garment.id,
    data: { garment },
  });
  const draggingGarmentId = useLookBuilder((s) => s.draggingGarmentId);
  const dimmed = isDragging || draggingGarmentId === garment.id;

  return (
    <motion.div
      ref={setNodeRef}
      whileHover={{ y: -3 }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: 'spring', stiffness: 380, damping: 28 }}
      className={cn(
        'group relative aspect-[3/4] cursor-grab overflow-hidden rounded-md border border-line-subtle bg-bg-secondary active:cursor-grabbing',
        dimmed && 'opacity-30',
      )}
      {...listeners}
      {...attributes}
    >
      <TileInner garment={garment} />
    </motion.div>
  );
}

function TileVisual({ garment }: { garment: Garment; overlay: true }) {
  return (
    <div
      className={cn(
        'group relative aspect-[3/4] overflow-hidden rounded-md border border-line-visible bg-bg-secondary',
        'cursor-grabbing rotate-[-2deg] shadow-2xl ring-1 ring-line-visible',
      )}
    >
      <TileInner garment={garment} />
    </div>
  );
}

function TileInner({ garment }: { garment: Garment }) {
  const phiaPrice = garment.phiaMatch?.lowestPrice;

  return (
    <>
      <Image
        src={garment.imageUrl}
        alt={garment.name}
        fill
        sizes="(min-width: 1280px) 240px, 40vw"
        className="object-cover"
        unoptimized
        draggable={false}
      />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/75 via-black/35 to-transparent p-3">
        <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-white/85">
          {garment.brand.toUpperCase()}
        </p>
        <p className="mt-0.5 truncate font-display text-[15px] font-light italic leading-tight text-white">
          {garment.name}
        </p>
        <p className="mt-1 flex items-baseline gap-2 text-[11px]">
          <span className="font-mono text-white/60 line-through">
            {formatCurrency(garment.retailPrice)}
          </span>
          {phiaPrice !== undefined && (
            <span className="display-italic text-[13px] text-accent-sage">
              {formatCurrency(phiaPrice)}
            </span>
          )}
        </p>
      </div>
    </>
  );
}
