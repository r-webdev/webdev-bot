import type { Client, ClientEvents } from "discord.js";
import type { DiscordEvent } from "../events/types.js";
import { config } from "../env.js";

export const createEvent = <T extends keyof ClientEvents = keyof ClientEvents>(
  data: {
    name: T;
    once?: boolean;
  },
  execute: (...args: ClientEvents[T]) => Promise<void> | void,
): DiscordEvent<T> => {
  return { ...data, execute };
};

export const createEvents = <T extends keyof ClientEvents = keyof ClientEvents>(
  events: Array<{
    data: {
      name: T;
      once?: boolean;
    };
    execute: (...args: ClientEvents[T]) => Promise<void> | void;
  }>,
): DiscordEvent<T>[] => {
  return events.map(({ data, execute }) => createEvent(data, execute));
};

export const registerEvents = async (
  client: Client,
  events: DiscordEvent[],
): Promise<void> => {
  for (const event of events) {
    console.log(`Loading event: ${event.name}`);
    client[event.once ? "once" : "on"](event.name, async (...args) => {
      try {
        // Skip processing if not in the intended server
        if (args[0]?.guild?.id !== config.serverId) {
          return;
        }
        await event.execute(...args);
      } catch (error) {
        console.error(`Error executing event ${event.name}:`, error);
      }
    });
  }
};
