import type { ClientEvents } from 'discord.js';

export type DiscordEvent<T extends keyof ClientEvents = keyof ClientEvents> = {
  name: T;
  once?: boolean;
  execute: (...args: ClientEvents[T]) => Promise<void> | void;
};
