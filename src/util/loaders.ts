import type { Client } from 'discord.js';
import { docsCommands } from '../commands/docs/index.js';
import { guidesCommand } from '../commands/guides/index.js';
import { type Command, predicate as commandPredicate } from '../commands/index.js';
import { pingCommand } from '../commands/ping.js';
import { tipsCommands } from '../commands/tips/index.js';
import { hasVarEvent } from '../events/has-var.js';
import { type DiscordEvent, predicate as eventPredicate } from '../events/index.js';
import { interactionCreateEvent } from '../events/interaction-create.js';
import { justAskEvent } from '../events/just-ask.js';
import { readyEvent } from '../events/ready.js';

/**
 * A predicate to check if the structure is valid
 */
export type StructurePredicate<T> = (structure: unknown) => structure is T;

/**
 * Register commands to the Discord API
 *
 * @param client - The Discord client
 * @param commands - A map of command names to commands
 */
export const registerCommands = async (
  client: Client,
  commands: Map<string, Command>
): Promise<void> => {
  // Convert the commands map to an array of command data
  const commandArray = Array.from(commands.values()).map((cmd) => cmd.data);

  try {
    // Register commands globally
    await client.application?.commands.set(commandArray);
    commandArray.forEach((cmd) => {
      console.log(`Registered command: ${cmd.type}, ${cmd.name}`);
    });
    console.log(`Registered ${commandArray.length} commands globally.`);
  } catch (error) {
    console.error('Error registering commands:', error);
  }
};

/**
 *	Register events to the Discord client
 *
 * @param client - The Discord client
 * @param events - An array of events
 */
export const registerEvents = async (client: Client, events: DiscordEvent[]): Promise<void> => {
  // Loop through all events
  for (const event of events) {
    console.log(`Loading event: ${event.name}`);
    // Register the event
    // If the event should be registered once, use "once", otherwise use "on"
    client[event.once ? 'once' : 'on'](event.name, async (...args) => {
      try {
        await event.execute(...args);
      } catch (error) {
        console.error(`Error executing event ${event.name}:`, error);
      }
    });
  }
};

/**
 *
 * @returns An array of events
 */
const loadEvents = (): DiscordEvent[] => {
  const events = [hasVarEvent, readyEvent, justAskEvent, interactionCreateEvent].filter(
    eventPredicate
  );
  return events as DiscordEvent[];
};

/**
 *
 * @returns A map of command names to commands
 */
const loadCommands = (): Map<string, Command> => {
  const commands = [pingCommand, tipsCommands, guidesCommand, docsCommands].flat();
  return new Map(commands.filter(commandPredicate).map((command) => [command.data.name, command]));
};

export const commands = loadCommands();
export const events = loadEvents();
