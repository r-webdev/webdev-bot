import { Events } from 'discord.js';
import { commands } from '../util/loaders.js';
import { createEvent } from './index.js';

export const interactionCreateEvent = createEvent(
  {
    name: Events.InteractionCreate,
  },
  async (interaction) => {
    if (interaction.isChatInputCommand() || interaction.isMessageContextMenuCommand()) {
      console.log(`Interaction received: ${interaction.commandName}`);
      const command = commands.get(interaction.commandName);

      if (!command) {
        throw new Error(`No command matching ${interaction.commandName} was found.`);
      }

      await command.execute(interaction);
    }
  }
);
