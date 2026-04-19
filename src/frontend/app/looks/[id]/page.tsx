'use client';

// Look Result — the hero demo moment. Try-on image + per-item phia pricing.
// Direct port of result.jsx:1–46. Variant (sideBySide|stacked) comes from
// the `?layout=` URL param; router replaces the source's onNav prop.

import { Suspense, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { getLook, getClient, getGarment, lookTotals } from '@/lib/mock';
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
  const generatedTryOnImageUrl = searchParams.get('tryOnImageUrl');
  const chainIdsParam = searchParams.get('chainIds');
  const failedId = searchParams.get('failedId');
  const isStacked = layoutParam === 'stacked';

  // chainIds is informational — parsed so we could surface the full chain later
  // if needed; today only failedId drives UI.
  const chainIds = chainIdsParam ? chainIdsParam.split(',').filter(Boolean) : [];
  void chainIds;
  const failedGarment = failedId ? getGarment(failedId) : undefined;

  const look = getLook(lookId);
  const [showShare, setShowShare] = useState(false);
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);
  const [swapGarment, setSwapGarment] = useState<Garment | null>(null);
  const [showHistory, setShowHistory] = useState(false);

  if (!look) return null;
  const client = getClient(look.clientId);
  if (!client) return null;
  const resolvedLook = generatedTryOnImageUrl
    ? { ...look, tryOnImageUrl: generatedTryOnImageUrl }
    : look;
  const totals = lookTotals(resolvedLook);

  // onItem is a no-op — no item-detail screen in our scope.
  const onItem = () => {};

  return (
    <div className="screen result" data-screen-label={`04 Look · ${resolvedLook.occasion}`}>
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
            <button
              className="btn btn-ghost"
              onClick={() => router.push(
                `/looks/${lookId}/view${generatedTryOnImageUrl ? `?tryOnImageUrl=${encodeURIComponent(generatedTryOnImageUrl)}` : ''}`,
              )}
            >
              <Icon.user /> Preview client view
            </button>
            <button className="btn btn-primary" onClick={() => setShowShare(true)}>
              <Icon.share /> Share with {client.name.split(' ')[0]}
            </button>
          </div>
        </div>

        {failedGarment && (
          <div className="partial-banner" role="status">
            <div className="partial-banner__icon" aria-hidden>
              <Icon.spark />
            </div>
            <p className="partial-banner__copy">
              Couldn&rsquo;t add the {failedGarment.name}. Retry to try again, or share as-is.
            </p>
            <button
              className="btn btn-primary partial-banner__cta"
              onClick={() => router.push(`/clients/${client.id}/new-look`)}
            >
              Retry
            </button>
          </div>
        )}

        {isStacked ? (
          <StackedResult look={resolvedLook} client={client} totals={totals} />
        ) : (
          <SideBySideResult
            look={resolvedLook}
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
        .partial-banner {
          display: flex;
          align-items: center;
          gap: 16px;
          padding: 14px 18px;
          margin-bottom: 24px;
          background: var(--accent-soft, #f7ece3);
          border: 1px solid var(--accent, #b00020);
          border-radius: 10px;
          color: var(--accent, #b00020);
        }
        .partial-banner__icon {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 28px;
          height: 28px;
          flex: 0 0 auto;
          color: var(--accent, #b00020);
        }
        .partial-banner__copy {
          flex: 1;
          margin: 0;
          font-size: 14px;
          line-height: 1.45;
          color: var(--ink, #1a1a1a);
        }
        .partial-banner__cta { flex: 0 0 auto; }
      `}</style>
    </div>
  );
}
