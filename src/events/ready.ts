import { Events } from 'discord.js';
import { config } from '../env.js';
import { fetchAndCachePublicChannelsMessages } from '../util/cache.js';
import { createEvent } from '../util/events.js';
import { syncGuidesToChannel } from '../util/post-guides.js';
import { leaveIfNotAllowedServer } from '../util/server-guard.js';

export const readyEvent = createEvent(
  {
    name: Events.ClientReady,
    once: true,
  },
  async (client) => {
    console.log(`Ready! Logged in as ${client.user.tag}`);

    // Check all guilds and leave any unauthorized ones
    console.log(`🔍 Checking ${client.guilds.cache.size} guild(s)...`);
    for (const guild of client.guilds.cache.values()) {
      await leaveIfNotAllowedServer(guild);
    }

    if (config.fetchAndSyncMessages) {
      const guild = client.guilds.cache.get(config.serverId);
      if (guild) {
        await fetchAndCachePublicChannelsMessages(guild, true);
      }

      // Sync guides to channel
      try {
        console.log(`🔄 Starting guide sync to channel ${config.guides.channelId}...`);
        await syncGuidesToChannel(client, config.guides.channelId);
      } catch (error) {
        console.error('❌ Failed to sync guides:', error);
      }
    }
  }
);
