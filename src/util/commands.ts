import type { ChatInputCommandInteraction, Client } from 'discord.js';
import type { Command } from '../commands/types.js';

export const createCommand = (command: Command): Command => {
  return command;
};

export const createCommands = (commands: Array<Command>): Command[] => {
  return commands.map(createCommand);
};

export const buildCommandString = (interaction: ChatInputCommandInteraction): string => {
  const commandName = interaction.commandName;
  return `/${commandName} ${interaction.options.data.map((option) => `${option.name}:${option.value}`).join(' ')}`;
};
