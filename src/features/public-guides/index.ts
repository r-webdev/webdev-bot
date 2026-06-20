import {
  ApplicationCommandOptionType,
  MessageFlags,
  PermissionFlagsBits,
  PermissionsBitField,
} from 'discord.js';
import { createSlashCommand } from '@/common/commands/create-commands.js';
import { config } from '@/env.js';
import {
  initializeGuidesChannel,
  syncGuidesToChannel,
} from '@/util/post-guides.js';

export const publicGuidesCommand = createSlashCommand({
  data: {
    name: 'post-public-guides',
    description: 'Post public guides to the designated channel',
    default_member_permissions: new PermissionsBitField(
      PermissionFlagsBits.ModerateMembers
    ).toJSON(),
    options: [
      {
        name: 'force',
        description: "Force reposting all guides even if they haven't changed",
        type: ApplicationCommandOptionType.Boolean,
        required: false,
      },
    ],
  },
  execute: async (interaction) => {
    const channelId = config.channelIds.guides;
    if (!channelId) {
      await interaction.reply({
        content: '❌ GUIDES_CHANNEL_ID environment variable is not set.',
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    await interaction.deferReply({ flags: MessageFlags.Ephemeral });
    try {
      const force = interaction.options.getBoolean('force') ?? false;
      if (force) {
        await initializeGuidesChannel(interaction.client, channelId);
      } else {
        await syncGuidesToChannel(interaction.client, channelId);
      }
      await interaction.editReply(
        '✅ Guides have been synchronized successfully.'
      );
    } catch (error) {
      console.error('Error synchronizing guides:', error);
      await interaction.editReply(
        '❌ An error occurred while synchronizing guides. Please check the logs for details.'
      );
    }
  },
});
