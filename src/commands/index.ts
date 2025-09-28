import type {
	CommandInteraction,
	RESTPostAPIApplicationCommandsJSONBody,
} from 'discord.js';
import { z } from 'zod';
import type { StructurePredicate } from '../util/loaders';

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
};

/**
 * Defines a schema for a command
 */
export const schema = z.object({
	data: z.custom<RESTPostAPIApplicationCommandsJSONBody>(),
	execute: z.function(),
});

/**
 * Defines the predicate to check if an object is a Command
 */
export const predicate: StructurePredicate<Command> = (
	obj: unknown,
): obj is Command => schema.safeParse(obj).success;
