import type { Guild } from 'discord.js';
import { getPublicChannels } from './channel.js';

const PER_CHANNEL_CACHE_LIMIT = 100;
export const cachedChannelsMap = new Set<string>();

export const fetchAndCachePublicChannelsMessages = async (guild: Guild, force = false) => {
  let cachedChannels = 0;
  const channels = getPublicChannels(guild);

  await Promise.all(
    channels.map(async (channel) => {
      if (force || !cachedChannelsMap.has(channel.id)) {
        const messages = await channel.messages.fetch({ limit: PER_CHANNEL_CACHE_LIMIT });
        console.log(
          `Fetched and cached ${messages.size} messages from channel ${channel.name} (${channel.id})`
        );
        cachedChannelsMap.add(channel.id);
        cachedChannels++;
      }
    })
  );
  return { cachedChannels, totalChannels: channels.size };
};
