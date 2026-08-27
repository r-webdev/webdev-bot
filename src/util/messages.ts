import { type Message, MessageType, type PartialMessage } from 'discord.js';

export type GuildMessage = Message<true>;

export const isNormalUserMessage = (
  message: Message | PartialMessage
): message is Message<true> => {
  const { author, system, type } = message;

  return (
    message.inGuild() &&
    !system &&
    author !== null &&
    !author.bot &&
    !author.system &&
    (type === MessageType.Default || type === MessageType.Reply)
  );
};
