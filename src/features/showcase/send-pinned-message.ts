import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChannelFlags,
  type MessageActionRowComponentBuilder,
  MessageFlags,
  PermissionFlagsBits,
  PermissionsBitField,
} from 'discord.js';
import { createSlashCommand } from '@/common/commands/create-commands.js';
import { config } from '@/env.js';

export const sendShowcasePinnedMessage = createSlashCommand({
  data: {
    name: 'send-showcase-pinned-message',
    description: 'Send showcase pinned message',
    default_member_permissions: new PermissionsBitField(
      PermissionFlagsBits.Administrator |
        PermissionFlagsBits.ManageGuild |
        PermissionFlagsBits.ModerateMembers
    ).toJSON(),
  },
  execute: async (interaction) => {
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });
    const showcaseChannel = interaction.guild?.channels.cache.get(config.channelIds.showcase);
    if (showcaseChannel === undefined || !showcaseChannel.isThreadOnly()) {
      await interaction.editReply({
        content: 'Showcase channel not found or is not a forum channel.',
      });
      return;
    }

    const activeThreads = await showcaseChannel.threads.fetchActive();
    const pinnedThread = activeThreads.threads.find((thread) =>
      thread.flags.has(ChannelFlags.Pinned)
    );

    const guideLines = [
      'Welcome to the Showcase channel! Please read the rules and guidelines before posting your content. Make sure to follow the format and include all necessary information. Happy sharing!',
      '',
      '1. Be respectful and follow the community guidelines.',
      '2. Use the correct format for your posts (e.g., title, description, tags).',
      '3. Include relevant media (images, videos) to showcase your content effectively.',
      '4. Avoid spamming or posting irrelevant content.',
      '5. Engage with other members and provide constructive feedback.',
      '6. If you have any questions, feel free to reach out to the moderators.',
      '7. Abusing the channel or violating the rules may result in removal of your post or further action by the moderators.',
      '8. Have fun and enjoy sharing your projects with the community!',
      '',
      'Press the button below to create a new post and share your project with the community!',
    ].join('\n');

    const actionRow = new ActionRowBuilder<MessageActionRowComponentBuilder>().addComponents(
      new ButtonBuilder()
        .setCustomId('create_showcase')
        .setLabel('Create Showcase Post')
        .setStyle(ButtonStyle.Primary)
    );

    if (pinnedThread) {
      if (!pinnedThread.locked) {
        await pinnedThread.setLocked(true);
      }
      const message = await pinnedThread.fetchStarterMessage();
      if (message !== null) {
        await message.edit({
          content: guideLines,
          components: [actionRow],
        });
      }

      await interaction.editReply({
        content: 'Showcase pinned message updated successfully.',
      });
      return;
    }

    const thread = await showcaseChannel.threads.create({
      name: 'Rules and Guidelines',
      message: {
        content: guideLines,
        components: [actionRow],
      },
    });
    thread.pin();
    thread.setLocked(true);

    await interaction.editReply({
      content: 'Showcase pinned message sent successfully.',
    });
  },
});
