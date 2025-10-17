import { PermissionFlagsBits, PermissionsBitField } from 'discord.js';
import { fetchAndCachePublicChannelsMessages } from '../../util/cache.js';
import { createCommand } from '../../util/commands.js';

export default createCommand({
  data: {
    name: 'cache-messages',
    description: 'Cache messages in all text channels of the server',
    default_member_permissions: new PermissionsBitField(
      PermissionFlagsBits.ManageMessages
    ).toJSON(),
  },
  execute: async (interaction) => {
    await interaction.deferReply();
    if (!interaction.guild) {
      await interaction.editReply('This command can only be used in a guild.');
      return;
    }

    if (!interaction.memberPermissions?.has(PermissionFlagsBits.ManageMessages)) {
      await interaction.editReply('You do not have permission to use this command.');
      return;
    }

    const guild = interaction.guild;

    await interaction.editReply('Caching messages in all public text channels...');

    const { cachedChannels, totalChannels } = await fetchAndCachePublicChannelsMessages(guild);

    await interaction.editReply(
      `Cached messages in ${cachedChannels} out of ${totalChannels} text channels.`
    );

    return;
  },
});
