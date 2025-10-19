import type { Guild } from 'discord.js';
import { getPublicChannels } from './channel.js';

const PER_CHANNEL_CACHE_LIMIT = 100;
export const cachedChannelsMap = new Set<string>();

export const fetchAndCachePublicChannelsMessages = async (guild: Guild, force = false) => {
  let cachedChannels = 0;
  const failedChannels: string[] = [];

  const channels = getPublicChannels(guild);

  await Promise.allSettled(
    channels.map(async (channel) => {
      if (force || !cachedChannelsMap.has(channel.id)) {
        try {
          const messages = await channel.messages.fetch({ limit: PER_CHANNEL_CACHE_LIMIT });
          console.log(
            `Fetched and cached ${messages.size} messages from channel ${channel.name} (${channel.id})`
          );
          cachedChannelsMap.add(channel.id);
          cachedChannels++;
        } catch (error) {
          console.error(
            `Failed to fetch messages from channel ${channel.name} (${channel.id}):`,
            error
          );
          failedChannels.push(channel.id);
          throw error;
        }
      }
    })
  );
  return { cachedChannels, totalChannels: channels.size, failedChannels };
};
