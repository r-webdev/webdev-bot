import { hasVarEvent } from './has-var.js';
import { interactionCreateEvent } from './interaction-create.js';
import { justAskEvent } from './just-ask.js';
import { readyEvent } from './ready.js';
import type { DiscordEvent } from './types.js';

export const events = [
  readyEvent,
  justAskEvent,
  hasVarEvent,
  interactionCreateEvent,
] as DiscordEvent[];
