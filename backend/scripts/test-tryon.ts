import {
  runTryOn,
  submitTryOn,
  getTryOnStatus,
  getTryOnResult,
} from '../src/fashn.js';

const SAMPLE_MODEL =
  'https://storage.googleapis.com/falserverless/example_inputs/model.png';
const SAMPLE_GARMENT =
  'https://storage.googleapis.com/falserverless/example_inputs/garment.webp';

const POLL_INTERVAL_MS = 2000;
const POLL_TIMEOUT_MS = 120_000;

function ms(start: number): string {
  return `${((Date.now() - start) / 1000).toFixed(1)}s`;
}

async function testSubscribe(): Promise<void> {
  console.log('\n=== Path 1: fal.subscribe (await-to-finish) ===');
  const start = Date.now();
  const result = await runTryOn({
    modelImage: SAMPLE_MODEL,
    garmentImage: SAMPLE_GARMENT,
    mode: 'balanced',
  });
  console.log(`[subscribe] requestId: ${result.requestId}`);
  console.log(`[subscribe] duration: ${ms(start)}`);
  console.log(`[subscribe] imageUrl:  ${result.imageUrl}`);
  if (result.allImageUrls.length > 1) {
    console.log(`[subscribe] +${result.allImageUrls.length - 1} more sample(s)`);
  }
}

async function testQueue(): Promise<void> {
  console.log('\n=== Path 2: queue.submit + status poll + result ===');
  const start = Date.now();
  const { jobId } = await submitTryOn({
    modelImage: SAMPLE_MODEL,
    garmentImage: SAMPLE_GARMENT,
    mode: 'balanced',
  });
  console.log(`[queue] jobId: ${jobId}`);

  const deadline = Date.now() + POLL_TIMEOUT_MS;
  let lastStatus = '';
  while (Date.now() < deadline) {
    const status = await getTryOnStatus(jobId);
    if (status.status !== lastStatus) {
      console.log(`[queue] status: ${status.status}`);
      lastStatus = status.status;
    }
    if (status.status === 'COMPLETED') break;
    if (status.status === 'FAILED') {
      throw new Error(`Job failed: ${status.error ?? 'unknown error'}`);
    }
    await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS));
  }
  if (lastStatus !== 'COMPLETED') {
    throw new Error(`Job timed out after ${POLL_TIMEOUT_MS / 1000}s`);
  }

  const result = await getTryOnResult(jobId);
  console.log(`[queue] duration: ${ms(start)}`);
  console.log(`[queue] imageUrl: ${result.imageUrl}`);
}

async function main(): Promise<void> {
  console.log('FASHN / fal.ai integration test');
  console.log(`Model: fal-ai/fashn/tryon/v1.6`);
  console.log(`Sample model:   ${SAMPLE_MODEL}`);
  console.log(`Sample garment: ${SAMPLE_GARMENT}`);

  await testSubscribe();
  await testQueue();

  console.log('\nAll paths passed.');
}

main().catch((err) => {
  console.error('\nFAILED:', err instanceof Error ? err.message : err);
  if (err instanceof Error && err.stack) console.error(err.stack);
  process.exit(1);
});
