import type { ChatInputCommandInteraction } from 'discord.js';

export const buildCommandString = (
  interaction: ChatInputCommandInteraction
): string => {
  const commandName = interaction.commandName;
  return `/${commandName} ${interaction.options.data.map((option) => `${option.name}:${option.value}`).join(' ')}`;
};
