import type { AutocompleteInteraction } from 'discord.js';
import { createLogger } from '@/util/logger.js';

const logger = createLogger('interactions');

export type AutoCompleteSubmitInteraction = {
  commandName: string;
  handler: (interaction: AutocompleteInteraction) => Promise<void> | void;
};

export const autoCompleteInteractions = new Map<
  string,
  AutoCompleteSubmitInteraction
>();

export const registerAutocompleteInteraction = (
  interaction: AutoCompleteSubmitInteraction
) => {
  logger.log(
    `Registering autocomplete interaction: ${interaction.commandName}`
  );
  autoCompleteInteractions.set(interaction.commandName, interaction);
};

export const handleAutoCompleteInteraction = async (
  interaction: AutocompleteInteraction
): Promise<void> => {
  const { commandName } = interaction;
  await autoCompleteInteractions.get(commandName)?.handler(interaction);
};
