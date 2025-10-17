import { Events } from 'discord.js';
import { config } from '../env.js';
import { fetchAndCachePublicChannelsMessages } from '../util/cache.js';
import { createEvent } from '../util/events.js';

export const readyEvent = createEvent(
  {
    name: Events.ClientReady,
    once: true,
  },
  async (client) => {
    console.log(`Ready! Logged in as ${client.user.tag}`);
    if (config.fetchAndSyncMessages) {
      const guild = client.guilds.cache.get(config.serverId);
      if (guild) {
        await fetchAndCachePublicChannelsMessages(guild, true);
      }
    }
  }
);
