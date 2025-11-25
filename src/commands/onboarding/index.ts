import { ApplicationCommandType, MessageFlags } from 'discord.js';
import { config } from '../../env.js';
import { addRoleToUser } from '../../util/addRoleToUser.js';
import { createCommand } from '../../util/commands.js';
import { containerComponent } from './component.js';

export const onboardingCommand = createCommand({
  data: {
    name: 'onboarding',
    description: 'Manage onboarding settings',
    type: ApplicationCommandType.ChatInput,
  },
  execute: async (interaction) => {
    const guild = interaction.guild;
    if (!guild) {
      await interaction.reply({
        content: 'This command can only be used in a server.',
        flags: MessageFlags.Ephemeral,
      });
      return;
    }
    // @ts-expect-error: This command isn't used and shouldn't affect anything, onboarding roles are TBD
    const onboardingRole = guild.roles.cache.get(config.onboarding.roleId);
    if (!onboardingRole) {
      await interaction.reply({
        content: 'Onboarding role not found. Please check the configuration.',
        flags: MessageFlags.Ephemeral,
      });
      return;
    }
    // @ts-expect-error: This command isn't used and shouldn't affect anything, onboarding channels are TBD
    const onboardingChannel = guild.channels.cache.get(config.onboarding.channelId);
    if (!onboardingChannel || !onboardingChannel.isSendable()) {
      await interaction.reply({
        content:
          'Onboarding channel not found or is not a text channel. Please check the configuration.',
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    const onboardingMessage = await interaction.reply({
      components: [containerComponent],
      flags: MessageFlags.IsComponentsV2,
    });

    const collector = onboardingMessage.createMessageComponentCollector({});

    collector.on('collect', async (componentInteraction) => {
      if (componentInteraction.customId === 'onboarding_add_role') {
        try {
          const member = await guild.members.fetch(componentInteraction.user.id);
          await addRoleToUser(member, onboardingRole);

          await componentInteraction.reply({
            content: `You have been given the ${onboardingRole.name} role!`,
            flags: MessageFlags.Ephemeral,
          });
        } catch (error) {
          await componentInteraction.reply({
            content: `Failed to add role. Please contact an administrator.`,
            flags: MessageFlags.Ephemeral,
          });
          console.error('Error adding role:\n', error);
        }
      }
    });
  },
});
