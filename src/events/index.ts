import { guildCreateEvent } from './guild-create.js';
import { hasVarEvent } from './has-var.js';
import { interactionCreateEvent } from './interaction-create.js';
import { justAskEvent } from './just-ask.js';
import { readyEvent } from './ready.js';
import type { DiscordEvent } from './types.js';

export const events = [
  readyEvent,
  guildCreateEvent,
  justAskEvent,
  hasVarEvent,
  interactionCreateEvent,
] as DiscordEvent[];
