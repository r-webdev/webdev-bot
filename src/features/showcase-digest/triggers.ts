import { createSlashCommand } from '@/common/commands/create-commands.js';
import { LOOKBACK_N } from './config.js';
import { digestHandler } from './handlers.js';

export const createDigestCommand = createSlashCommand({
  data: {
    name: 'digest-force',
    description: `Forcefully consumes posts of the last ${LOOKBACK_N} days`,
  },
  execute: digestHandler,
});
