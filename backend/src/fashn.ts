import './env.js';
import { fal } from '@fal-ai/client';
import type { JobStatus, TryOnInput, TryOnResult } from './types.js';

fal.config({ credentials: process.env.FAL_KEY });

const MODEL_ID = 'fal-ai/fashn/tryon/v1.6';

type FashnImage = { url: string };
type FashnOutput = { images: FashnImage[] };

type FashnInput = {
  model_image: string;
  garment_image: string;
  category: TryOnInput['category'];
  mode: TryOnInput['mode'];
  garment_photo_type: TryOnInput['garmentPhotoType'];
  num_samples: number;
  output_format: TryOnInput['outputFormat'];
  seed?: number;
};

function buildInput(input: TryOnInput): FashnInput {
  const out: FashnInput = {
    model_image: input.modelImage,
    garment_image: input.garmentImage,
    category: input.category ?? 'auto',
    mode: input.mode ?? 'balanced',
    garment_photo_type: input.garmentPhotoType ?? 'auto',
    num_samples: input.numSamples ?? 1,
    output_format: input.outputFormat ?? 'png',
  };
  if (input.seed !== undefined) out.seed = input.seed;
  return out;
}

function toResult(data: FashnOutput, requestId: string): TryOnResult {
  const urls = data.images.map((i) => i.url);
  return { imageUrl: urls[0], allImageUrls: urls, requestId };
}

export async function runTryOn(input: TryOnInput): Promise<TryOnResult> {
  const result = await fal.subscribe(MODEL_ID, {
    input: buildInput(input),
    logs: true,
    onQueueUpdate: (update) => {
      if (update.status === 'IN_PROGRESS' && 'logs' in update && update.logs) {
        update.logs.forEach((log) => console.log(`[fashn] ${log.message}`));
      }
    },
  });
  return toResult(result.data as FashnOutput, result.requestId);
}

export async function submitTryOn(input: TryOnInput): Promise<{ jobId: string }> {
  const submitted = await fal.queue.submit(MODEL_ID, { input: buildInput(input) });
  return { jobId: submitted.request_id };
}

export async function getTryOnStatus(jobId: string): Promise<JobStatus> {
  const status = await fal.queue.status(MODEL_ID, { requestId: jobId, logs: false });
  switch (status.status) {
    case 'IN_QUEUE':
      return { status: 'IN_QUEUE', queuePosition: status.queue_position };
    case 'IN_PROGRESS':
      return { status: 'IN_PROGRESS' };
    case 'COMPLETED':
      return { status: 'COMPLETED' };
  }
  throw new Error('unreachable: fal queue status returned an unknown state');
}

export async function getTryOnResult(jobId: string): Promise<TryOnResult> {
  const result = await fal.queue.result(MODEL_ID, { requestId: jobId });
  return toResult(result.data as FashnOutput, result.requestId);
}
