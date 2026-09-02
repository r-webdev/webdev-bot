import type { ClientEvents, Events, GuildMember } from 'discord.js';
import { UserBotMessagesService } from '@/services/user-bot-messages/user-bot-messages-service.js';

export const DELETE_EMOJIS = ['🗑️', '❌'];

export const removeUserBotMessage: (
  ...args: ClientEvents[Events.MessageReactionAdd]
) => Promise<void> | void = async (reaction, user) => {
  if (
    reaction.emoji.name === null ||
    !DELETE_EMOJIS.includes(reaction.emoji.name)
  ) {
    return;
  }

  if (reaction.message.author?.id !== user.client.user.id) {
    return;
  }

  const guild = reaction.message.guild;
  if (guild === null) {
    return;
  }

  let member: GuildMember;
  try {
    member =
      guild.members.cache.get(user.id) ?? (await guild.members.fetch(user.id));
  } catch {
    return;
  }

  try {
    const deleted = await UserBotMessagesService.deleteUserBotMessage({
      messageId: reaction.message.id,
      user: member,
    });

    if (deleted) {
      await reaction.message.delete();
    }
  } catch {
    return;
  }
};
