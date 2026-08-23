import type { StringSelectMenuInteraction } from 'discord.js';
import { parseCustomId } from '@/util/custom-id.js';

export type SelectMenuSubmitInteraction = {
  commandName: string;
  handler: (interaction: StringSelectMenuInteraction) => Promise<void> | void;
};

export const selectMenuSubmitInteractions = new Map<
  string,
  SelectMenuSubmitInteraction
>();

export const registerSelectMenuSubmitInteraction = (
  interaction: SelectMenuSubmitInteraction
) => {
  console.log(
    `Registering select menu submit interaction: ${interaction.commandName}`
  );
  selectMenuSubmitInteractions.set(interaction.commandName, interaction);
};

export const handleSelectMenuInteraction = async (
  interaction: StringSelectMenuInteraction
): Promise<void> => {
  const commandName = parseCustomId(interaction.customId)[0];
  await selectMenuSubmitInteractions.get(commandName)?.handler(interaction);
};
