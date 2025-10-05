import type { CommandInteraction, RESTPostAPIApplicationCommandsJSONBody } from 'discord.js';

export type Command = {
  data: RESTPostAPIApplicationCommandsJSONBody;
  execute: (interaction: CommandInteraction) => Promise<void> | void;
};
