import * as cron from 'node-cron';
import { createSlashCommand } from '@/common/commands/create-commands.js';
import { LOOKBACK_N } from './config.js';
import { digestHandler, createShowcaseDigest } from './handlers.js';
import { ShowcaseDigestValidationError } from './util.js';

export const createDigestCommand = createSlashCommand({
  data: {
    name: 'digest-force',
    description: `Forcefully consumes posts of the last ${LOOKBACK_N} days`,
  },
  execute: digestHandler,
});

// Fire on the 1st and 3rd Friday of every month at 16:00 UTC using node-cron's
// nth-weekday syntax (5#1 = first Friday, 5#3 = third Friday).
// https://www.nodecron.com/cron-syntax#nth-weekday
const SHOWCASE_DIGEST_CRONS = ['0 16 * * 5#1', '0 16 * * 5#3'];

const runScheduledShowcaseDigest = (): void => {
  console.log('Running scheduled showcase digest...');
  createShowcaseDigest()
    .then(() => console.log(`Successfully displayed showcase digest!`))
    .catch((error) => {
      if (error instanceof ShowcaseDigestValidationError) {
        error.logError(); // No output to give to the user.
      } else {
        console.error('Something unexpected happened: ', error);
      }
    });
};

export function initializeShowcaseDigestScheduler(): void {
  console.log('Initializing showcase digest scheduler...');

  SHOWCASE_DIGEST_CRONS.forEach((expression) => {
    cron.schedule(expression, runScheduledShowcaseDigest, { timezone: 'UTC' });
  });

  console.log(
    'Showcase digest scheduler initialized (runs 1st and 3rd Fridays at 16:00 UTC)'
  );
}
