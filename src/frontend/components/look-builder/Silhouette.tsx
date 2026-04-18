'use client';

import { SilhouetteSvg, slotAnchors } from './silhouette-svg';
import { DropZone } from './DropZone';
import { useLookBuilder } from '@/stores/useLookBuilder';
import type { SlotId } from '@/lib/types';

export function Silhouette() {
  const slots = useLookBuilder((s) => s.slots);
  const remove = useLookBuilder((s) => s.remove);

  return (
    <div className="relative mx-auto aspect-[360/720] h-[min(75vh,640px)]">
      <SilhouetteSvg className="absolute inset-0 h-full w-full text-ink-disabled" />
      {(Object.entries(slotAnchors) as [SlotId, (typeof slotAnchors)[SlotId]][]).map(
        ([slotId, anchor]) => (
          <DropZone
            key={slotId}
            slotId={slotId}
            anchor={anchor}
            occupant={slots[slotId]}
            onRemove={() => remove(slotId)}
          />
        ),
      )}
    </div>
  );
}
