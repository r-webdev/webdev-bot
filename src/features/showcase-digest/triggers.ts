import * as cron from 'node-cron';
import { createSlashCommand } from '@/common/commands/create-commands.js';
import { LOOKBACK_N } from './config.js';
import {
  digestHandler,
  digestResultsHandler,
  createShowcaseDigest,
  processShowcaseDigestResults,
} from './handlers.js';

export const createDigestCommand = createSlashCommand({
  data: {
    name: 'digest-force',
    description: `Forcefully consumes posts of the last ${LOOKBACK_N} days`,
  },
  execute: digestHandler,
});

export const createDigestResultsCommand = createSlashCommand({
  data: {
    name: 'digest-results-force',
    description: 'Forcefully tallies the latest digest and announces results',
  },
  execute: digestResultsHandler,
});

// Fire on the 1st and 3rd Friday of every month at 16:00 UTC using node-cron's
// nth-weekday syntax (5#1 = first Friday, 5#3 = third Friday).
// https://www.nodecron.com/cron-syntax#nth-weekday
const SHOWCASE_DIGEST_CRONS = ['0 16 * * 5#1', '0 16 * * 5#3'];

// Monday at 16:00 UTC, three days after the Friday digests.
const SHOWCASE_DIGEST_RESULTS_CRON = '0 16 * * 1';

const runScheduledShowcaseDigest = async (): Promise<void> => {
  console.log('Running scheduled showcase digest...');
  try {
    await createShowcaseDigest();
    console.log(`Successfully displayed showcase digest!`);
  } catch (error) {
    console.error(error);
  }
};

const runScheduledShowcaseDigestResults = async (): Promise<void> => {
  console.log('Running scheduled showcase digest results...');
  try {
    await processShowcaseDigestResults();
  } catch (error) {
    console.error(error);
  }
};

export function initializeShowcaseDigestScheduler(): void {
  console.log('Initializing showcase digest scheduler...');

  SHOWCASE_DIGEST_CRONS.forEach((expression) => {
    cron.schedule(expression, runScheduledShowcaseDigest, { timezone: 'UTC' });
  });

  cron.schedule(
    SHOWCASE_DIGEST_RESULTS_CRON,
    runScheduledShowcaseDigestResults,
    { timezone: 'UTC' }
  );

  console.log(
    'Showcase digest scheduler initialized (digests on 1st and 3rd Fridays at 16:00 UTC, results on Mondays at 16:00 UTC)'
  );
}
