import { config } from 'dotenv';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const repoRootEnv = resolve(here, '..', '..', '.env');
config({ path: repoRootEnv });

export const FAL_KEY = process.env.FAL_KEY;

if (!FAL_KEY) {
  throw new Error(
    `FAL_KEY missing. Expected it in ${repoRootEnv} (repo root .env). ` +
      `Set it to your fal.ai key and retry.`,
  );
}
