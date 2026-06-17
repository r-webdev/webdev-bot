import type { ClientEvents } from 'discord.js';

export type DiscordEvent = {
  name: keyof ClientEvents;
  once?: boolean;
  execute: (...args: unknown[]) => Promise<void> | void;
};
