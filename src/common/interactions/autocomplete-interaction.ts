import type { AutocompleteInteraction } from 'discord.js';

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
  console.log(
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
