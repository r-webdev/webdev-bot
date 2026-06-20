import type { ModalSubmitInteraction as ModalInteraction } from 'discord.js';
import { parseCustomId } from '@/util/custom-id.js';

export type ModalSubmitInteraction = {
  commandName: string;
  handler: (interaction: ModalInteraction) => Promise<void> | void;
};

export const modalSubmitInteractions = new Map<
  string,
  ModalSubmitInteraction
>();

export const registerModalSubmitInteraction = (
  interaction: ModalSubmitInteraction
) => {
  console.log(
    `Registering modal submit interaction: ${interaction.commandName}`
  );
  modalSubmitInteractions.set(interaction.commandName, interaction);
};

export const handleModalInteraction = async (
  interaction: ModalInteraction
): Promise<void> => {
  const commandName = parseCustomId(interaction.customId)[0];
  await modalSubmitInteractions.get(commandName)?.handler(interaction);
};
