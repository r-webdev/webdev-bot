import * as cron from 'node-cron';
import { createSlashCommand } from '@/common/commands/create-commands.js';
import { WEEK } from '@/constants/time.js';
import { LOOKBACK_N } from './config.js';
import { digestHandler, runShowcaseDigest } from './handlers.js';

export const createDigestCommand = createSlashCommand({
  data: {
    name: 'digest-force',
    description: `Forcefully consumes posts of the last ${LOOKBACK_N} days`,
  },
  execute: digestHandler,
});

// https://github.com/node-cron/node-cron?tab=readme-ov-file#cron-syntax
const SHOWCASE_DIGEST_CRON = '0 16 * * 5';

// Number of weeks between runs, derived from the lookback window. node-cron
// can't express "every N days" directly, so we fire weekly and skip the weeks
// that don't line up with the interval.
const INTERVAL_WEEKS = Math.max(1, Math.round(LOOKBACK_N / 7));

const currentWeekIndex = (): number => Math.floor(Date.now() / WEEK);

const isScheduledWeek = (): boolean =>
  currentWeekIndex() % INTERVAL_WEEKS === 0;

export function initializeShowcaseDigestScheduler(): void {
  console.log('Initializing showcase digest scheduler...');

  cron.schedule(
    SHOWCASE_DIGEST_CRON,
    () => {
      if (!isScheduledWeek()) {
        console.log(
          `Skipping showcase digest this week (runs every ${INTERVAL_WEEKS} week(s))`
        );
        return;
      }
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
    `Showcase digest scheduler initialized (runs Fridays at 16:00 UTC, every ${INTERVAL_WEEKS} week(s))`
  );
}
