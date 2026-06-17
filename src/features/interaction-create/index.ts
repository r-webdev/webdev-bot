import { ApplicationCommandType, Events, MessageFlags } from 'discord.js';
import { commands } from '@/common/commands/index.js';
import { createEvent } from '@/common/events/create-event.js';
import { handleAutoCompleteInteraction } from '@/common/interactions/autocomplete-interaction.js';
import { handleButtonInteraction } from '@/common/interactions/button-interaction.js';
import { handleModalInteraction } from '@/common/interactions/modal-interaction.js';
import { isAllowedServer } from '@/util/server-guard.js';

export const interactionCreateEvent = createEvent(
  {
    name: Events.InteractionCreate,
  },
  async (interaction) => {
    if (!interaction.guildId || !isAllowedServer(interaction.guildId)) {
      console.log(`⚠️ Command blocked from unauthorized server: ${interaction.guildId}`);
      if (interaction.isRepliable()) {
        await interaction.reply({
          content: '❌ This bot is not authorized to operate in this server.',
          flags: MessageFlags.Ephemeral,
        });
      }
      return;
    }
    if (interaction.isButton()) {
      console.log(`Received button interaction with custom ID: ${interaction.customId}`);
      await handleButtonInteraction(interaction);
      return;
    }

    if (interaction.isModalSubmit()) {
      console.log(`Received modal submit interaction with custom ID: ${interaction.customId}`);
      await handleModalInteraction(interaction);
      return;
    }

    if (interaction.isAutocomplete()) {
      console.log(`Received autocomplete interaction with custom ID: ${interaction.commandName}`);
      await handleAutoCompleteInteraction(interaction);
      return;
    }

    if (
      !interaction.isChatInputCommand() &&
      !interaction.isMessageContextMenuCommand() &&
      !interaction.isUserContextMenuCommand()
    ) {
      return;
    }

    const command = commands.get(interaction.commandName);

    if (command === undefined) {
      throw new Error(`Command ${interaction.commandName} not found`);
    }

    if (command.commandType === ApplicationCommandType.ChatInput) {
      if (!interaction.isChatInputCommand()) {
        throw new Error('Command type mismatch: expected ChatInput interaction');
      }
      await command.execute(interaction);
    } else if (command.commandType === ApplicationCommandType.Message) {
      if (!interaction.isMessageContextMenuCommand()) {
        throw new Error('Command type mismatch: expected Message context menu interaction');
      }
      await command.execute(interaction);
    } else if (command.commandType === ApplicationCommandType.User) {
      if (!interaction.isUserContextMenuCommand()) {
        throw new Error('Command type mismatch: expected User context menu interaction');
      }
      await command.execute(interaction);
    }
  }
);
