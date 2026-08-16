import { guildCreateEvent } from '@/features/guild-create/index.js';
import { hasVarEvent } from '@/features/has-var/index.js';
import { interactionCreateEvent } from '@/features/interaction-create/index.js';
import { readyEvent } from '@/features/ready/index.js';
import type { DiscordEvent } from './types.js';
import { spamDetection } from '@/features/spam-detection/index.js';

export const events: DiscordEvent[] = [
  readyEvent,
  guildCreateEvent,
  hasVarEvent,
  interactionCreateEvent,
  spamDetection,
].flat();
