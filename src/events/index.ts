import type { ClientEvents } from 'discord.js';
import z from 'zod';
import type { StructurePredicate } from '../util/loaders';

/**
 * Defines the structure of an Event
 */
export type DiscordEvent<T extends keyof ClientEvents = keyof ClientEvents> = {
	/**
	 * The name of the event to listen to
	 */
	name: T;
	/**
	 * Whether the event should be listened to only once
	 *
	 * @default false
	 */
	once?: boolean;
	/**
	 * The function to execute when the event is triggered
	 *
	 * @param args - The arguments passed by the event
	 */
	execute: (...args: ClientEvents[T]) => Promise<void> | void;
};

/**
 * Defines the schema for an event
 */
export const schema = z.object({
	name: z.string(),
	once: z.boolean().optional().default(false),
	execute: z.function(),
});

/**
 * Defines the predicate to check if an object is a valid Event type.
 */
export const predicate: StructurePredicate<DiscordEvent> = (
	obj: unknown,
): obj is DiscordEvent => schema.safeParse(obj).success;
