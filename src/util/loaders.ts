import type { PathLike } from 'node:fs';
import { readdir, stat } from 'node:fs/promises';
import type { Client } from 'discord.js';
import { type Command, predicate as commandPredicate } from '../commands/index.js';
import { type DiscordEvent, predicate as eventPredicate } from '../events/index.js';

/**
 * A predicate to check if the structure is valid
 */
export type StructurePredicate<T> = (structure: unknown) => structure is T;

/**
 * Loads all structures in the provided directory
 *
 * @param dir - The directory to load the structures from
 * @param predicate - The predicate to check if the structure is valid
 * @param recursive- Whether to load structures recursively
 * @returns
 */
export const loadStructures = async <T>(
  dir: PathLike,
  predicate: StructurePredicate<T>,
  recursive = true
): Promise<T[]> => {
  const statDir = await stat(dir);

  if (!statDir.isDirectory()) {
    throw new Error(`The path ${dir} is not a directory`);
  }

  // Get all files in the directory
  const files = await readdir(dir);

  // Create an empty array to store the structures
  const structures: T[] = [];

  // Loop through all files in the directory
  for (const file of files) {
    const fileUrl = new URL(`${dir}/${file}`, import.meta.url);

    // Get the stats of the file
    const fileStat = await stat(fileUrl);

    // If the file is a directory and recursive is true, load the structures in the directory
    if (fileStat.isDirectory() && recursive) {
      structures.push(...(await loadStructures(fileUrl, predicate, recursive)));
      continue;
    }

    // If the file is index.js or the file does not end with .js, skip it
    if (
      // file === 'index.js' ||
      // file === 'index.ts' ||
      !file.endsWith('.js') &&
      !file.endsWith('.ts')
    ) {
      continue;
    }

    // Import the structure from the file
    const { default: structure } = await import(fileUrl.href);

    // If the structure is an array, loop through all structures in the array and check if they are valid
    // If the structure is not an array, check if it is valid
    if (Array.isArray(structure)) {
      for (const str of structure) {
        if (predicate(str)) {
          structures.push(str);
        }
      }
    } else if (predicate(structure)) {
      structures.push(structure);
    }
  }
  return structures;
};

/**
 * Gets all the commands in the provided directory
 *
 * @param dir - The directory to load the commands from
 * @param recursive - Whether to load commands recursively
 * @returns A map of command names to commands
 */
export const getCommands = async (
  dir: PathLike,
  recursive = true
): Promise<Map<string, Command>> => {
  const commands = await loadStructures<Command>(dir, commandPredicate, recursive);

  return new Map(commands.map((command) => [command.data.name, command]));
};

/**
 * Gets all the events in the provided directory
 *
 * @param dir - The directory to load the events from
 * @param recursive - Whether to load events recursively
 * @returns An array of events
 */
export const getEvents = async (dir: PathLike, recursive = true): Promise<DiscordEvent[]> => {
  return loadStructures(dir, eventPredicate, recursive);
};

/**
 * Loads commands to the Discord API
 *
 * @param client - The Discord client
 * @param commands - A map of command names to commands
 */
export const loadCommands = async (client: Client, commands: Map<string, Command>) => {
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
 *	Loads events to the Discord client
 *
 * @param client - The Discord client
 * @param events - An array of events
 */
export const loadEvents = async (client: Client, events: DiscordEvent[]) => {
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
