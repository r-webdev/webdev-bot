import type { OptionKey } from '@generated/prisma/enums.js';
import { type ChatInputCommandInteraction, MessageFlags } from 'discord.js';
import { getBotOption } from '@/options.js';
import { basicMessage } from '@/util/components/basic-message.js';

export const getOptionHandler = async (
  interaction: ChatInputCommandInteraction
) => {
  const optionKey = interaction.options.getString('option', true) as OptionKey;
  const option = getBotOption(optionKey);
  await interaction.reply({
    components: [basicMessage(`**${option.displayName}**: ${option.value}`)],
    flags: MessageFlags.Ephemeral | MessageFlags.IsComponentsV2,
  });
};
