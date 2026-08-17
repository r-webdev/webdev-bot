import { type ChatInputCommandInteraction, MessageFlags } from 'discord.js';
import { ErrorMessages } from '@/error-messages/index.js';
import { getBotOption, setBotOption } from '@/options.js';
import { isStaff } from '@/util/permissions.js';
import { OptionKey } from '@generated/prisma/enums.js';
import { getCommandUser } from '@/util/member.js';
import { basicMessage } from '@/util/components/basic-message.js';

export const setOptionHandler = async (
  interaction: ChatInputCommandInteraction
) => {
  const commandUser = getCommandUser(interaction);
  if (!isStaff(commandUser)) {
    await interaction.reply({
      components: [ErrorMessages.User.MissingPermissions],
      flags: MessageFlags.Ephemeral | MessageFlags.IsComponentsV2,
    });
  }

  const optionKey = interaction.options.getString('option', true) as OptionKey;
  const value = interaction.options.getString('value', true);

  const option = getBotOption(optionKey);

  if (isInvalidOptionValue(option, value)) {
    await interaction.reply({
      components: [
        ErrorMessages.OptionTypes.InvalidType(optionKey, option.type),
      ],
      flags: MessageFlags.Ephemeral | MessageFlags.IsComponentsV2,
    });
    return;
  }

  await setBotOption(optionKey, value);

  await interaction.reply({
    components: [basicMessage(`Set **${optionKey}** to **${value}**`)],
    flags: MessageFlags.Ephemeral | MessageFlags.IsComponentsV2,
  });
};

function isInvalidOptionValue(
  option: ReturnType<typeof getBotOption>,
  value: string
) {
  if (option.type === 'number') {
    return Number.isNaN(Number(value));
  }

  if (option.type === 'boolean') {
    return !['true', 'false'].includes(value);
  }

  return false;
}
