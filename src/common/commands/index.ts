import { docsCommands } from '@/features/docs/index.js';
import { guidesCommand } from '@/features/guides/index.js';
import cacheMessages from '@/features/cache-messages/index.js';
import { repelCommand } from '@/features/moderation/repel.js';
import { pingCommand } from '@/features/ping/index.js';
import { publicGuidesCommand } from '@/features/public-guides/index.js';
import { createShowcaseCommand } from '@/features/showcase/create-showcase.js';
import { sendShowcasePinnedMessage } from '@/features/showcase/send-pinned-message.js';
import { tipsCommands } from '@/features/tips/index.js';
import type { Command } from './types.js';
import { reportMessage } from '@/features/report-message/index.js';
import { tagCommand } from '@/features/tags/index.js';
import { botOptionsCommand } from '@/features/bot-options/index.js';

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
    sendShowcasePinnedMessage,
    reportMessage,
    tagCommand,
    botOptionsCommand,
  ]
    .flat()
    .map((command) => [command.data.name, command])
);
