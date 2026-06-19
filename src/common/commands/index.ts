import { docsCommands } from '@/features/docs/index.js';
import { guidesCommand } from '@/features/guides/index.js';
import cacheMessages from '@/features/moderation/cache-messages.js';
import { repelCommand } from '@/features/moderation/repel.js';
import { pingCommand } from '@/features/ping/index.js';
import { publicGuidesCommand } from '@/features/public-guides/index.js';
import { createShowcaseCommand } from '@/features/showcase/create-showcase.js';
import { tipsCommands } from '@/features/tips/index.js';
import type { Command } from './types.js';

export const commands = new Map<string, Command>(
  [
    pingCommand,
    guidesCommand,
    docsCommands,
    tipsCommands,
    repelCommand,
    cacheMessages,
    publicGuidesCommand,
    createShowcaseCommand,
  ]
    .flat()
    .map((command) => [command.data.name, command])
);
