import type { CommandInteraction, RESTPostAPIApplicationCommandsJSONBody } from 'discord.js';
import { z } from 'zod';
import type { StructurePredicate } from '../util/loaders.js';

export type Command = {
  /**
   * The data for the command
   */
  data: RESTPostAPIApplicationCommandsJSONBody;
  /**
   * The function execute when the command is called
   *
   * @param interaction - The interaction that triggered the command
   */
  execute: (interaction: CommandInteraction) => Promise<void> | void;

  __isCommand__: true;
};

/**
 * Defines a schema for a command
 */
export const schema = z.object({
  data: z.custom<RESTPostAPIApplicationCommandsJSONBody>(),
  execute: z.function(),
  __isCommand__: z.literal(true),
});

/**
 * Defines the predicate to check if an object is a Command
 */
export const predicate: StructurePredicate<Command> = (obj: unknown): obj is Command =>
  schema.safeParse(obj).success;

/**
 *
 * Creates a command object
 *
 * @param data - The command data
 * @param execute - The function to execute when the command is called
 * @returns
 */
export const createCommand = (
  data: RESTPostAPIApplicationCommandsJSONBody,
  execute: (interaction: CommandInteraction) => Promise<void> | void
): Command => {
  return { data, execute, __isCommand__: true } satisfies Command;
};

/**
 *  Creates multiple commands
 *
 * @param commands - An array of command data and execute functions
 * @returns
 */
export const createCommands = (
  commands: Array<{
    data: RESTPostAPIApplicationCommandsJSONBody;
    execute: (interaction: CommandInteraction) => Promise<void> | void;
  }>
): Command[] => {
  return commands.map(({ data, execute }) => createCommand(data, execute));
};
