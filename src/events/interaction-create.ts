import { Events, MessageFlags } from 'discord.js';
import { commands } from '../commands/index.js';
import { createEvent } from '../util/events.js';
import { isAllowedServer } from '../util/server-guard.js';

export const interactionCreateEvent = createEvent(
  {
    name: Events.InteractionCreate,
  },
  async (interaction) => {
    if (interaction.isChatInputCommand() || interaction.isMessageContextMenuCommand()) {
      // Block commands from unauthorized servers
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

      console.log(`Interaction received: ${interaction.commandName}`);
      const command = commands.get(interaction.commandName);

      if (!command) {
        throw new Error(`No command matching ${interaction.commandName} was found.`);
      }

      await command.execute(interaction);
    }
  }
);
