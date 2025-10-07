import type {
  Client,
  CommandInteraction,
  RESTPostAPIApplicationCommandsJSONBody,
} from 'discord.js';
import type { Command } from '../commands/types.js';

export const createCommand = (
  data: RESTPostAPIApplicationCommandsJSONBody,
  execute: (interaction: CommandInteraction) => Promise<void> | void
): Command => {
  return { data, execute } satisfies Command;
};

export const createCommands = (
  commands: Array<{
    data: RESTPostAPIApplicationCommandsJSONBody;
    execute: (interaction: CommandInteraction) => Promise<void> | void;
  }>
): Command[] => {
  return commands.map(({ data, execute }) => createCommand(data, execute));
};

export const registerCommands = async (
  client: Client,
  commands: Map<string, Command>
): Promise<void> => {
  const commandArray = Array.from(commands.values()).map((cmd) => cmd.data);

  try {
    await client.application?.commands.set(commandArray);
    commandArray.forEach((cmd) => {
      console.log(`Registered command: ${cmd.type}, ${cmd.name}`);
    });
    console.log(`Registered ${commandArray.length} commands globally.`);
  } catch (error) {
    console.error('Error registering commands:', error);
  }
};
