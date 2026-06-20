import type { ButtonInteraction } from 'discord.js';
import { parseCustomId } from '@/util/custom-id.js';

export type ButtonSubmitInteraction = {
  commandName: string;
  handler: (interaction: ButtonInteraction) => Promise<void> | void;
};

export const buttonSubmitInteractions = new Map<
  string,
  ButtonSubmitInteraction
>();

export const registerButtonSubmitInteraction = (
  interaction: ButtonSubmitInteraction
) => {
  console.log(
    `Registering button submit interaction: ${interaction.commandName}`
  );
  buttonSubmitInteractions.set(interaction.commandName, interaction);
};

export const handleButtonInteraction = async (
  interaction: ButtonInteraction
): Promise<void> => {
  const commandName = parseCustomId(interaction.customId)[0];
  await buttonSubmitInteractions.get(commandName)?.handler(interaction);
};
