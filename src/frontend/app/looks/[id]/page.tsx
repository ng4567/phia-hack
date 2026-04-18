'use client';

// Look Result — the hero demo moment. Try-on image + per-item phia pricing.
// Direct port of result.jsx:1–46. Variant (sideBySide|stacked) comes from
// the `?layout=` URL param; router replaces the source's onNav prop.

import { Suspense, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { getLook, getClient, lookTotals } from '@/lib/mock';
import type { Garment } from '@/lib/mock';
import { Icon } from '@/components/Icon';
import { SideBySideResult } from '@/components/result/SideBySideResult';
import { StackedResult } from '@/components/result/StackedResult';
import { ShareModal } from '@/components/result/ShareModal';
import { SwapPanel } from '@/components/result/SwapPanel';
import { LookHistoryPanel } from '@/components/result/LookHistoryPanel';

export default function LookResult() {
  return (
    <Suspense fallback={null}>
      <LookResultInner />
    </Suspense>
  );
}

function LookResultInner() {
  const router = useRouter();
  const { id: lookId } = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const layoutParam = searchParams.get('layout');
  const isStacked = layoutParam === 'stacked';

  const look = getLook(lookId);
  const [showShare, setShowShare] = useState(false);
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);
  const [swapGarment, setSwapGarment] = useState<Garment | null>(null);
  const [showHistory, setShowHistory] = useState(false);

  if (!look) return null;
  const client = getClient(look.clientId);
  if (!client) return null;
  const totals = lookTotals(look);

  // onItem is a no-op — no item-detail screen in our scope.
  const onItem = () => {};

  return (
    <div className="screen result" data-screen-label={`04 Look · ${look.occasion}`}>
      <div className="res-shell">
        {/* Subhead */}
        <div className="res-head">
          <button className="btn btn-ghost" onClick={() => router.push(`/clients/${client.id}`)}>
            <Icon.back /> Back to {client.name.split(' ')[0]}
          </button>
          <div className="row gap-12">
            <button className="btn btn-ghost" onClick={() => setShowHistory(true)}>
              History
            </button>
            <button className="btn btn-ghost" onClick={() => router.push(`/looks/${lookId}/view`)}>
              <Icon.user /> Preview client view
            </button>
            <button className="btn btn-primary" onClick={() => setShowShare(true)}>
              <Icon.share /> Share with {client.name.split(' ')[0]}
            </button>
          </div>
        </div>

        {isStacked ? (
          <StackedResult look={look} client={client} totals={totals} />
        ) : (
          <SideBySideResult
            look={look}
            client={client}
            totals={totals}
            hoverIdx={hoverIdx}
            setHoverIdx={setHoverIdx}
            onItem={onItem}
            onSwap={setSwapGarment}
          />
        )}

        {showShare && (
          <ShareModal
            client={client}
            lookId={lookId}
            onClose={() => setShowShare(false)}
            onPreview={() => router.push(`/looks/${lookId}/view`)}
          />
        )}
        {swapGarment && (
          <SwapPanel garment={swapGarment} onClose={() => setSwapGarment(null)} />
        )}
        {showHistory && (
          <LookHistoryPanel lookId={lookId} onClose={() => setShowHistory(false)} />
        )}
      </div>

      <style jsx>{`
        .res-shell { max-width: 1440px; margin: 0 auto; padding: 18px 32px 80px; }
        .res-head { display: flex; align-items: center; justify-content: space-between; gap: 16px; margin-bottom: 32px; }
      `}</style>
    </div>
  );
}
