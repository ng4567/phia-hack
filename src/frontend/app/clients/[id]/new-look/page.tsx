'use client';

// Look Builder — stylist drags garments onto the board.
// Direct port of builder.jsx:1–238. Route params replace the prop-drilled
// clientId; router replaces the source's onNav prop.
//
// Wave 2 seeding: honors `?seed=g1,g2,g3` and `?occasion=…` query params
// coming from the Gmail closet click, the upcoming-events list, and
// the AI brief overlay — so a deep-link into the builder lands with a
// starting board and occasion already populated.

import { Suspense, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { cx, fmt } from '@/lib/utils';
import { MOCK, getClient, getGarment } from '@/lib/mock';
import type { Garment } from '@/lib/mock';
import { Icon } from '@/components/Icon';
import { SavingsBadge } from '@/components/SavingsBadge';
import { GenerateOverlay } from '@/components/builder/GenerateOverlay';
import type { StepStatus } from '@/components/builder/GenerateOverlay';

function getBackendBaseUrl(): string {
  const configured = process.env.NEXT_PUBLIC_TRYON_BACKEND_URL?.trim();
  if (configured) {
    return new URL(configured).toString().replace(/\/+$/, '');
  }
  if (process.env.NODE_ENV === 'production') {
    throw new Error('NEXT_PUBLIC_TRYON_BACKEND_URL must be set in production.');
  }
  return 'http://127.0.0.1:8000';
}

const BACKEND_BASE_URL = getBackendBaseUrl();
const PHOEBE_CLIENT_ID = 'sarah';
const PHOEBE_LOOK_ID = 'look-sarah-1';
const RED_AIKO_SILK_SLIP_DRESS_ID = 'g1';
const AIKO_DRESS_IMAGE_PATH = '/data/female/dress.jpg';
const MAX_CHAIN_LENGTH = 3;

// Deterministic chain ordering:
// - one-piece wins (if any) → [most-recent one-piece]
// - else → [most-recent bottom?, most-recent top?]
// - append most-recent outerwear (if any)
// - drop shoes + accessories
// - cap at 3
function buildChain(boardGarments: Garment[]): Garment[] {
  const latestOf = (cat: Garment['category']): Garment | undefined =>
    [...boardGarments].reverse().find((g) => g.category === cat);

  const onePiece = latestOf('one-piece');
  const base: Garment[] = onePiece
    ? [onePiece]
    : ([latestOf('bottom'), latestOf('top')].filter(Boolean) as Garment[]);

  const outer = latestOf('outerwear');
  const chain = outer ? [...base, outer] : base;
  return chain.slice(0, MAX_CHAIN_LENGTH);
}

async function toUploadFile(imageUrl: string, filename: string): Promise<File> {
  const response = await fetch(imageUrl);
  if (!response.ok) throw new Error(`Failed to fetch image for upload: ${filename}`);
  const blob = await response.blob();
  return new File([blob], filename, { type: blob.type || 'application/octet-stream' });
}

export default function LookBuilder() {
  return (
    <Suspense fallback={null}>
      <LookBuilderInner />
    </Suspense>
  );
}

function LookBuilderInner() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const client = getClient(id);

  // Query-string seeding from Wave 2 deep-links. `seed` is a comma-
  // separated list of catalog garment ids; `occasion` is a free-form
  // string that prefills the occasion input. Both are optional.
  const searchParams = useSearchParams();
  const seedIds = searchParams.get('seed')?.split(',').filter(Boolean) ?? [];
  const seedOcc = searchParams.get('occasion') ?? '';

  const [boardIds, setBoardIds] = useState<string[]>(
    seedIds.length ? seedIds : ['g16', 'g3', 'g13'],
  );
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [occasion, setOccasion] = useState(seedOcc || 'Rooftop engagement party');
  const [generating, setGenerating] = useState(false);
  const [generateError, setGenerateError] = useState<string | null>(null);
  const [dragId, setDragId] = useState<string | null>(null);

  // Chain progress state — real, not faked.
  const [chainGarments, setChainGarments] = useState<Garment[]>([]);
  const [activeStepIndex, setActiveStepIndex] = useState(0);
  const [stepStatuses, setStepStatuses] = useState<StepStatus[]>([]);
  const [latestIntermediateUrl, setLatestIntermediateUrl] = useState<string | undefined>(undefined);

  if (!client) return null;

  const cats = ['all', 'top', 'bottom', 'one-piece', 'outerwear', 'shoes', 'accessory'];
  const filtered = MOCK.garments.filter((g) => {
    if (category !== 'all' && g.category !== category) return false;
    if (search && !(`${g.brand} ${g.name}`.toLowerCase().includes(search.toLowerCase()))) return false;
    return true;
  });

  const boardGarments = boardIds
    .map((bid) => getGarment(bid))
    .filter((g): g is Garment => Boolean(g));
  const totals: { retail: number; phia: number; savings: number } = {
    ...(boardGarments.length
      ? {
          retail: boardGarments.reduce((s, g) => s + g.retailPrice, 0),
          phia: boardGarments.reduce((s, g) => s + g.phia.lowest, 0),
        }
      : { retail: 0, phia: 0 }),
    savings: 0,
  };
  totals.savings = totals.retail - totals.phia;

  function addToBoard(gid: string) {
    if (!boardIds.includes(gid)) setBoardIds([...boardIds, gid]);
  }
  function removeFromBoard(gid: string) {
    setBoardIds(boardIds.filter((x) => x !== gid));
  }

  async function handleGenerate() {
    if (!client) return;
    setGenerateError(null);

    try {
      const backendOrigin = new URL(BACKEND_BASE_URL).origin;
      if (window.location.origin === backendOrigin) {
        throw new Error(
          'Set NEXT_PUBLIC_TRYON_BACKEND_URL to your backend address (different from frontend).',
        );
      }

      const chain = buildChain(boardGarments);
      if (chain.length === 0) {
        throw new Error('Add a supported piece (top, bottom, one-piece, or outerwear) to generate a try-on.');
      }

      // Build the person file the same way as today (Phoebe special case).
      const personImageUrl = client.id === PHOEBE_CLIENT_ID
        ? `${window.location.origin}/clients/phoebe.png`
        : new URL(client.photoUrl, window.location.origin).toString();
      const personFilename = client.id === PHOEBE_CLIENT_ID ? 'phoebe.png' : `${client.id}.png`;

      // Initialize chain-progress state.
      const initialStatuses: StepStatus[] = chain.map(() => 'pending');
      setChainGarments(chain);
      setActiveStepIndex(0);
      setStepStatuses(initialStatuses);
      setLatestIntermediateUrl(undefined);
      setGenerating(true);

      // Local mirrors — React state updates are async but we need the latest
      // values for subsequent iterations of this loop.
      const statuses: StepStatus[] = [...initialStatuses];
      const results: Array<{ garment: Garment; status: StepStatus; imageUrl?: string; error?: string }> =
        chain.map((g) => ({ garment: g, status: 'pending' as StepStatus }));

      let personFileForStep: File | undefined = await toUploadFile(personImageUrl, personFilename);
      let personUrlForStep: string | undefined;

      // Even on cache hit (where FAL returns instantly), keep the overlay up
      // long enough for the caption cycle to feel authored — not a flash.
      const MIN_STEP_MS = 7000;

      for (let i = 0; i < chain.length; i++) {
        const g = chain[i];
        setActiveStepIndex(i);

        // Anchor the floor at the start of the step so slow steps don't
        // add extra time on top of their real duration.
        const minStepElapsed = new Promise<void>((resolve) =>
          setTimeout(resolve, MIN_STEP_MS),
        );

        const usesPhoebeAikoAsset =
          client.id === PHOEBE_CLIENT_ID && g.id === RED_AIKO_SILK_SLIP_DRESS_ID;
        const dressImageUrl = usesPhoebeAikoAsset
          ? `${BACKEND_BASE_URL}${AIKO_DRESS_IMAGE_PATH}`
          : new URL(g.imageUrl, window.location.origin).toString();
        const dressFilename = usesPhoebeAikoAsset ? 'dress.jpg' : `${g.id}.jpg`;

        try {
          const dressFile = await toUploadFile(dressImageUrl, dressFilename);

          const formData = new FormData();
          formData.append('clothes', dressFile);
          if (i === 0) {
            if (!personFileForStep) throw new Error('Missing person image for step 0.');
            formData.append('person', personFileForStep);
          } else {
            if (!personUrlForStep) throw new Error('Missing person_url for chained step.');
            formData.append('person_url', personUrlForStep);
          }

          const response = await fetch(`${BACKEND_BASE_URL}/api/tryon`, {
            method: 'POST',
            body: formData,
          });
          const responseText = await response.text();
          let payload: { detail?: string; outputs?: string[] } = {};
          if (responseText) {
            try {
              payload = JSON.parse(responseText) as { detail?: string; outputs?: string[] };
            } catch {
              payload = { detail: responseText };
            }
          }
          if (!response.ok) {
            throw new Error(payload.detail || 'Try-on request failed.');
          }
          const outputUrl = payload.outputs?.[0];
          if (!outputUrl) {
            throw new Error('Try-on API returned no output image.');
          }

          // Hold the step until both the FAL result and the minimum-duration
          // floor have landed.
          await minStepElapsed;

          results[i] = { garment: g, status: 'ok', imageUrl: outputUrl };
          statuses[i] = 'ok';
          setStepStatuses([...statuses]);
          setLatestIntermediateUrl(outputUrl);

          personUrlForStep = outputUrl;
          personFileForStep = undefined;
        } catch (err) {
          const message = err instanceof Error ? err.message : String(err);
          results[i] = { garment: g, status: 'failed', error: message };
          statuses[i] = 'failed';
          for (let j = i + 1; j < chain.length; j++) {
            results[j] = { garment: chain[j], status: 'skipped' };
            statuses[j] = 'skipped';
          }
          setStepStatuses([...statuses]);
          break;
        }
      }

      // Find the last successful step.
      let lastOkIndex = -1;
      for (let i = results.length - 1; i >= 0; i--) {
        if (results[i].status === 'ok') { lastOkIndex = i; break; }
      }

      if (lastOkIndex === -1) {
        setGenerating(false);
        setGenerateError('Generation failed before any step completed.');
        return;
      }

      const finalUrl = results[lastOkIndex].imageUrl!;
      const chainIds = chain.map((g) => g.id).join(',');
      const failed = results.find((r) => r.status === 'failed');
      const failedParam = failed
        ? `&failedId=${encodeURIComponent(failed.garment.id)}`
        : '';
      setGenerating(false);
      router.push(
        `/looks/${PHOEBE_LOOK_ID}?tryOnImageUrl=${encodeURIComponent(finalUrl)}&chainIds=${encodeURIComponent(chainIds)}${failedParam}`,
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to generate try-on.';
      setGenerateError(message);
      setGenerating(false);
    }
  }

  return (
    <div className="screen builder" data-screen-label="03 Look Builder">
      <div className="builder-shell">
        {/* Subhead */}
        <div className="builder-head">
          <div className="crumb">
            <span onClick={() => router.push('/dashboard')} style={{ cursor: 'pointer' }}>Clients</span>
            <span style={{ color: 'var(--ink-4)' }}>/</span>
            <span onClick={() => router.push(`/clients/${id}`)} style={{ cursor: 'pointer' }}>{client.name}</span>
            <span style={{ color: 'var(--ink-4)' }}>/</span>
            <span>New look</span>
          </div>
          <div className="row gap-16" style={{ alignItems: 'center' }}>
            <input
              className="occ-input"
              value={occasion}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setOccasion(e.target.value)}
              placeholder="Occasion or prompt — rooftop wedding, July, Charleston"
            />
            <button className="btn btn-ghost" onClick={() => router.push(`/clients/${id}`)}>Save draft</button>
            <button className="btn btn-primary" onClick={() => void handleGenerate()} disabled={boardIds.length === 0 || generating}>
              <Icon.spark /> Generate try-on
            </button>
          </div>
        </div>
        {generateError && (
          <div className="micro" style={{ color: '#b00020', marginBottom: 12 }}>
            {generateError}
          </div>
        )}

        <div className="builder-grid">
          {/* LEFT: catalog */}
          <aside className="cat-panel">
            <div className="cat-search">
              <Icon.search />
              <input
                placeholder="Search or paste a product URL"
                value={search}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)}
              />
            </div>
            <div className="cat-cats">
              {cats.map((c) => (
                <button
                  key={c}
                  className={cx('pill', category === c && 'active')}
                  onClick={() => setCategory(c)}
                  style={{ textTransform: 'capitalize' }}
                >
                  {c === 'all' ? 'All pieces' : c}
                </button>
              ))}
            </div>
            <div className="cat-grid">
              {filtered.map((g) => (
                <div
                  key={g.id}
                  className={cx('cat-item', boardIds.includes(g.id) && 'added')}
                  draggable
                  onDragStart={() => setDragId(g.id)}
                  onDragEnd={() => setDragId(null)}
                  onClick={() => addToBoard(g.id)}
                >
                  <div className="ci-img" style={{ backgroundImage: `url(${g.imageUrl})` }}>
                    {boardIds.includes(g.id) && <div className="ci-check"><Icon.check /></div>}
                  </div>
                  <div style={{ padding: '8px 2px 0' }}>
                    <div className="micro">{g.brand}</div>
                    <div style={{ fontSize: 12, lineHeight: 1.3, marginTop: 2 }}>{g.name}</div>
                    <div className="row gap-6" style={{ alignItems: 'baseline', marginTop: 4 }}>
                      <span style={{ fontSize: 12, fontWeight: 500 }}>{fmt(g.phia.lowest)}</span>
                      <span className="strike" style={{ fontSize: 10 }}>{fmt(g.retailPrice)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </aside>

          {/* RIGHT: the board */}
          <div className="board-panel">
            <div className="board-head">
              <div className="col">
                <div className="micro">Look board</div>
                <div className="serif-italic" style={{ fontSize: 30, lineHeight: 1.1, marginTop: 2 }}>
                  {occasion || 'Untitled look'}
                </div>
              </div>
              <div className="row gap-24">
                <div className="col" style={{ alignItems: 'flex-end' }}>
                  <div className="micro">Retail total</div>
                  <div className="serif strike" style={{ fontSize: 22 }}>{fmt(totals.retail)}</div>
                </div>
                <div className="col" style={{ alignItems: 'flex-end' }}>
                  <div className="micro">With phia</div>
                  <div className="serif" style={{ fontSize: 28, color: 'var(--accent)' }}>{fmt(totals.phia)}</div>
                </div>
                <div className="col" style={{ alignItems: 'flex-end' }}>
                  <div className="micro">Saved</div>
                  <div className="serif" style={{ fontSize: 22, color: 'var(--sage)' }}>{fmt(totals.savings)}</div>
                </div>
              </div>
            </div>

            <div
              className={cx('board-drop', dragId && 'board-dragover')}
              onDragOver={(e: React.DragEvent<HTMLDivElement>) => { e.preventDefault(); }}
              onDrop={() => { if (dragId) addToBoard(dragId); setDragId(null); }}
            >
              {boardGarments.length === 0 ? (
                <div className="board-empty">
                  <div className="serif-italic" style={{ fontSize: 28, color: 'var(--ink-2)' }}>Drop pieces to start the look.</div>
                  <div className="micro" style={{ marginTop: 10, color: 'var(--ink-3)' }}>Try one top, one bottom, one shoe — you can remix from there.</div>
                </div>
              ) : (
                <div className="board-items">
                  {boardGarments.map((g) => (
                    <div key={g.id} className="bi">
                      <div className="bi-drag"><Icon.drag /></div>
                      <div className="bi-img" style={{ backgroundImage: `url(${g.imageUrl})` }} />
                      <div className="bi-info">
                        <div className="micro">{g.brand} · <span style={{ textTransform: 'capitalize' }}>{g.category}</span></div>
                        <div className="serif" style={{ fontSize: 18, lineHeight: 1.2, marginTop: 3 }}>{g.name}</div>
                        <div className="row gap-10" style={{ alignItems: 'baseline', marginTop: 8 }}>
                          <span style={{ fontSize: 15, fontWeight: 500 }}>{fmt(g.phia.lowest)}</span>
                          <span className="strike" style={{ fontSize: 12 }}>{fmt(g.retailPrice)}</span>
                          <SavingsBadge pct={g.phia.savings} />
                        </div>
                        <div className="micro" style={{ marginTop: 6, fontSize: 10 }}>via {g.phia.source} · {g.phia.condition}</div>
                      </div>
                      <button className="bi-remove" onClick={() => removeFromBoard(g.id)}><Icon.x /></button>
                    </div>
                  ))}
                  <div className="bi-sugg">
                    <Icon.spark />
                    <div style={{ fontSize: 13 }}>Suggest a piece for this occasion</div>
                    <div className="micro" style={{ color: 'var(--ink-4)', marginTop: 4 }}>Uses phia&apos;s item graph to pair-match</div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Generating overlay */}
        {generating && (
          <GenerateOverlay
            client={client}
            chainGarments={chainGarments}
            activeStep={activeStepIndex}
            stepStatuses={stepStatuses}
            latestIntermediateUrl={latestIntermediateUrl}
          />
        )}
      </div>

      <style jsx>{`
        .builder-shell { max-width: 1600px; margin: 0 auto; padding: 18px 24px 36px; }
        .builder-head { display: flex; align-items: center; justify-content: space-between; gap: 16px; margin-bottom: 18px; }
        .crumb { display: flex; gap: 10px; font-size: 12.5px; color: var(--ink-3); }

        .occ-input {
          width: 380px; padding: 11px 18px; border-radius: 999px;
          background: var(--card); border: 1px solid var(--line);
          font-size: 13px; color: var(--ink); outline: none;
        }
        .occ-input:focus { border-color: var(--ink-3); }
        .occ-input::placeholder { color: var(--ink-4); }

        .builder-grid { display: grid; grid-template-columns: 440px 1fr; gap: 24px; height: calc(100vh - 154px); min-height: 640px; }

        .cat-panel {
          background: var(--card); border-radius: var(--radius-lg);
          display: flex; flex-direction: column;
          overflow: hidden; padding: 18px; box-shadow: var(--shadow-sm);
        }
        .cat-search { display: flex; align-items: center; gap: 8px; padding: 10px 14px;
          background: var(--bg); border-radius: 999px; color: var(--ink-3); }
        .cat-search input { flex: 1; border: none; background: transparent; outline: none; font-size: 13px; color: var(--ink); }
        .cat-cats { display: flex; gap: 6px; flex-wrap: wrap; margin: 14px 0 16px; }
        .cat-cats .pill { padding: 5px 11px; font-size: 11.5px; }
        .cat-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; overflow-y: auto; padding-right: 4px; }
        .cat-item { cursor: grab; transition: transform .15s ease; }
        .cat-item:active { cursor: grabbing; }
        .cat-item:hover { transform: translateY(-2px); }
        .ci-img { aspect-ratio: 3/4; border-radius: 10px; background: var(--bg-sub) center/cover no-repeat; position: relative; }
        .ci-check { position: absolute; top: 8px; right: 8px; width: 22px; height: 22px; border-radius: 50%;
          background: var(--sage); color: #fff; display: flex; align-items: center; justify-content: center; }
        .cat-item.added .ci-img { outline: 2px solid var(--sage); outline-offset: 2px; }

        .board-panel {
          background: var(--card); border-radius: var(--radius-lg);
          padding: 26px 30px 26px; display: flex; flex-direction: column;
          box-shadow: var(--shadow-sm);
        }
        .board-head { display: flex; align-items: flex-end; justify-content: space-between; padding-bottom: 22px; border-bottom: 1px solid var(--line); }

        .board-drop { flex: 1; overflow-y: auto; padding: 22px 0 4px; transition: background .15s ease; border-radius: 12px; margin-top: 10px; }
        .board-dragover { background: var(--accent-soft); }
        .board-empty { height: 100%; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; padding: 60px 20px; }

        .board-items { display: flex; flex-direction: column; gap: 12px; }
        .bi { display: grid; grid-template-columns: 20px 120px 1fr 36px; gap: 18px; align-items: center; padding: 14px; border-radius: var(--radius); background: var(--bg); border: 1px solid transparent; transition: all .15s ease; }
        .bi:hover { background: #FAF9F6; border-color: var(--line); }
        .bi-drag { color: var(--ink-4); cursor: grab; }
        .bi-img { aspect-ratio: 3/4; background: var(--card) center/cover no-repeat; border-radius: 8px; }
        .bi-remove { width: 28px; height: 28px; border-radius: 50%; color: var(--ink-3); display: flex; align-items: center; justify-content: center; }
        .bi-remove:hover { background: var(--card); color: var(--ink); }

        .bi-sugg {
          display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center;
          padding: 22px; border: 1px dashed var(--line-2); border-radius: var(--radius);
          color: var(--ink-2); cursor: pointer; gap: 8px;
        }
        .bi-sugg:hover { background: var(--bg); border-color: var(--accent); color: var(--accent); }

        @media (max-width: 1200px) {
          .builder-grid { grid-template-columns: 360px 1fr; }
        }
      `}</style>
    </div>
  );
}
