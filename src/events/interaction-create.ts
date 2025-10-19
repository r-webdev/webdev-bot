import { Events } from "discord.js";
import { commands } from "../commands/index.js";
import { config } from "../env.js";
import { createEvent } from "../util/events.js";

export const interactionCreateEvent = createEvent(
  {
    name: Events.InteractionCreate,
  },
  async (interaction) => {
    if (
      interaction.isChatInputCommand() ||
      interaction.isMessageContextMenuCommand()
    ) {
      // Skip processing if not in the intended server
      if (interaction.guild?.id !== config.serverId) {
        return;
      }

      console.log(`Interaction received: ${interaction.commandName}`);
      const command = commands.get(interaction.commandName);

      if (!command) {
        throw new Error(
          `No command matching ${interaction.commandName} was found.`,
        );
      }

      await command.execute(interaction);
    }
  },
);
