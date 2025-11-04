import { docsCommands } from './docs/index.js';
import { guidesCommand } from './guides/index.js';
import cacheMessages from './moderation/cache-messages.js';
import { repelCommand } from './moderation/repel.js';
import { onboardingCommand } from './onboarding/index.js';
import { pingCommand } from './ping.js';
import { tipsCommands } from './tips/index.js';
import type { Command } from './types.js';

export const commands = new Map<string, Command>(
  [
    pingCommand,
    guidesCommand,
    docsCommands,
    tipsCommands,
    repelCommand,
    cacheMessages,
    onboardingCommand,
  ]
    .flat()
    .map((cmd) => [cmd.data.name, cmd])
);
