import { ChannelType, type Guild, PermissionFlagsBits, type TextChannel } from 'discord.js';

export const getPublicChannels = (guild: Guild) => {
  return guild.channels.cache.filter(
    (channel): channel is TextChannel =>
      channel.type === ChannelType.GuildText &&
      channel
        .permissionsFor(guild.roles.everyone)
        ?.has(
          PermissionFlagsBits.ViewChannel |
            PermissionFlagsBits.ReadMessageHistory |
            PermissionFlagsBits.SendMessages
        )
  );
};
