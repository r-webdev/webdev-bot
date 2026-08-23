import { Events } from 'discord.js';
import { createEvent } from '@/common/events/create-event.js';
import { config } from '@/env.js';
import { initializeAdventScheduler } from '@/util/advent-scheduler.js';
import { fetchAndCachePublicChannelsMessages } from '@/util/cache.js';
import { syncGuidesToChannel } from '@/util/post-guides.js';
import { leaveIfNotAllowedServer } from '@/util/server-guard.js';
import { syncArchiveCategoryChannels } from '../archive-channels/util.js';

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

    const guild = client.guilds.cache.get(config.discord.serverId);
    if (!guild) {
      console.error(
        `❌ Bot is not in the configured server with ID ${config.discord.serverId}`
      );
      console.error('Please check your .env file or CI/CD configuration');
      process.exit(1);
    }

    if (config.fetchAndSyncMessages) {
      await fetchAndCachePublicChannelsMessages(guild, true);

      // Sync guides to channel
      try {
        console.log(
          `🔄 Starting guide sync to channel ${config.channelIds.guides}...`
        );
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

    // Make sure all channels in the archived category are properly archived on startup
    try {
      await syncArchiveCategoryChannels(guild);
    } catch (error) {
      console.error(
        '❌ Failed to ensure archived channels are properly archived:',
        error
      );
    }
  }
);
