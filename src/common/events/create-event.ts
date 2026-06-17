import type { ClientEvents } from 'discord.js';
import type { DiscordEvent } from './types.js';

export const createEvent = <T extends keyof ClientEvents>(
  data: {
    name: T;
    once?: boolean;
  },
  execute: (...args: ClientEvents[T]) => Promise<void> | void
): DiscordEvent => {
  return {
    ...data,
    execute: execute as (...args: unknown[]) => Promise<void> | void,
  };
};
