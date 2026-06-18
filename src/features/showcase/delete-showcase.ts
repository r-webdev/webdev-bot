import { MessageFlags } from 'discord.js';
import type { ButtonSubmitInteraction } from '@/common/interactions/button-interaction.js';
import { parseCustomId } from '@/util/custom-id.js';
import { isUserInServer, isUserModerator } from '@/util/member.js';

export const deleteShowcase: ButtonSubmitInteraction = {
  commandName: 'delete_showcase',
  handler: async (interaction) => {
    const interactionUser = interaction.user;
    const [, ownerId] = parseCustomId(interaction.customId);
    console.log({
      interactionUserId: interactionUser.id,
      ownerId,
    });

    if (!interaction.member || !isUserInServer(interaction.member)) {
      await interaction.reply({
        content: '❌ This command can only be used by server members.',
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    if (interactionUser.id !== ownerId && !isUserModerator(interaction.member, interaction)) {
      await interaction.reply({
        content: '❌ You do not have permission to delete this showcase.',
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    try {
      await interaction.channel?.delete();
    } catch (error) {
      console.error('Error deleting showcase:', error);
      await interaction.reply({
        content: '❌ An error occurred while trying to delete the showcase.',
        flags: MessageFlags.Ephemeral,
      });
    }
  },
};

// Registration is in create-showcase.ts
