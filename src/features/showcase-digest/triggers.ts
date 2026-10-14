import * as cron from 'node-cron';
import { createSlashCommand } from '@/common/commands/create-commands.js';
import { LOOKBACK_N } from './config.js';
import { digestHandler, runShowcaseDigest } from './handlers.js';

export const createDigestCommand = createSlashCommand({
  data: {
    name: 'digest-force',
    description: `Forcefully consumes posts of the last ${LOOKBACK_N} days`,
  },
  execute: digestHandler,
});

// Weekly, Fridays at 16:00 UTC. Pairs with the default 7-day lookback window.
// https://github.com/node-cron/node-cron?tab=readme-ov-file#cron-syntax
const SHOWCASE_DIGEST_CRON = '0 16 * * 5';

export function initializeShowcaseDigestScheduler(): void {
  console.log('Initializing showcase digest scheduler...');

  cron.schedule(
    SHOWCASE_DIGEST_CRON,
    () => {
      console.log('Running scheduled showcase digest...');
      runShowcaseDigest()
        .then((result) => console.log(`Scheduled showcase digest: ${result}`))
        .catch((error) =>
          console.error('Error in scheduled showcase digest:', error)
        );
    },
    { timezone: 'UTC' }
  );

  console.log(
    'Showcase digest scheduler initialized (runs Fridays at 16:00 UTC)'
  );
}
