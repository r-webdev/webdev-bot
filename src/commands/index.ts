import { docsCommands } from './docs/index.js';
import { guidesCommand } from './guides/index.js';
import { pingCommand } from './ping.js';
import { tipsCommands } from './tips/index.js';
import type { Command } from './types.js';

export const commands = new Map<string, Command>(
  [pingCommand, guidesCommand, docsCommands, tipsCommands].flat().map((cmd) => [cmd.data.name, cmd])
);
