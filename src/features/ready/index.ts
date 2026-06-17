import { Events } from 'discord.js';
import { createEvent } from '@/common/events/create-event.js';
import { config } from '@/env.js';
import { initializeAdventScheduler } from '@/util/advent-scheduler.js';
import { fetchAndCachePublicChannelsMessages } from '@/util/cache.js';
import { syncGuidesToChannel } from '@/util/post-guides.js';
import { leaveIfNotAllowedServer } from '@/util/server-guard.js';

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
      const guild = client.guilds.cache.get(config.discord.serverId);
      if (guild) {
        await fetchAndCachePublicChannelsMessages(guild, true);
      }

      // Sync guides to channel
      try {
        console.log(`🔄 Starting guide sync to channel ${config.channelIds.guides}...`);
        await syncGuidesToChannel(client, config.channelIds.guides);
      } catch (error) {
        if (error && typeof error === 'object' && 'code' in error) {
          const discordError = error as { code: number; message?: string };
          if (discordError.code === 50001) {
            console.warn(
              '⚠️ Bot does not have access to the guides channel. Please check bot permissions and channel ID.'
            );
          } else {
            console.error('❌ Failed to sync guides:', error);
          }
        } else {
          console.error('❌ Failed to sync guides:', error);
        }
      }
    }

    // Initialize Advent of Code scheduler
    try {
      initializeAdventScheduler(client, config.channelIds.adventOfCode);
    } catch (error) {
      console.error('❌ Failed to initialize Advent of Code scheduler:', error);
    }
  }
);
