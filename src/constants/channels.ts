import type {
  CategoryChannel,
  ForumChannel,
  Guild,
  TextChannel,
} from 'discord.js';
import { ChannelType } from 'discord.js';
import { config } from '@/env.js';

export type ChannelKey = keyof typeof config.channelIds;

type ChannelTypeMap = {
  repelLogs: TextChannel;
  guides: TextChannel;
  adventOfCode: ForumChannel;
  showcase: ForumChannel;
  showcaseLogs: TextChannel;
  showcaseRules: TextChannel;
  spamDetection: TextChannel;
  archiveCategory: CategoryChannel;
};

const EXPECTED_DISCORD_TYPE: Record<ChannelKey, ChannelType> = {
  repelLogs: ChannelType.GuildText,
  guides: ChannelType.GuildText,
  adventOfCode: ChannelType.GuildForum,
  showcase: ChannelType.GuildForum,
  showcaseLogs: ChannelType.GuildText,
  showcaseRules: ChannelType.GuildText,
  spamDetection: ChannelType.GuildText,
  archiveCategory: ChannelType.GuildCategory,
};

const resolveChannel = <Key extends ChannelKey>(
  guild: Guild,
  key: Key
): ChannelTypeMap[Key] => {
  const channelId = config.channelIds[key];
  const channel = guild.channels.cache.get(channelId);

  if (!channel) {
    throw new Error(
      `Channel with ID ${channelId} (key: ${key}) not found in the guild.`
    );
  }

  const expectedType = EXPECTED_DISCORD_TYPE[key];
  if (channel.type !== expectedType) {
    throw new Error(
      `Channel "${key}" (${channelId}) has type ${ChannelType[channel.type]}, expected ${ChannelType[expectedType]}.`
    );
  }

  return channel as ChannelTypeMap[Key];
};

export const SERVER_CHANNELS = {} as {
  [Key in ChannelKey]: ChannelTypeMap[Key];
};

const assignResolvedChannel = <Key extends ChannelKey>(
  key: Key,
  channel: ChannelTypeMap[Key]
): void => {
  SERVER_CHANNELS[key] = channel;
};

export const resolveChannels = (guild: Guild): void => {
  (Object.keys(config.channelIds) as ChannelKey[]).forEach((key) => {
    assignResolvedChannel(key, resolveChannel(guild, key));
  });
};
