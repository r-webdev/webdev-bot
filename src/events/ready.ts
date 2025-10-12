import { Events } from 'discord.js';
import { config } from '../env.js';
import { createEvent } from '../util/events.js';
import { syncGuidesToChannel } from '../util/post-guides.js';

export const readyEvent = createEvent(
  {
    name: Events.ClientReady,
    once: true,
  },
  async (client) => {
    console.log(`Ready! Logged in as ${client.user.tag}`);

    // Sync guides to channel
    try {
      console.log(`🔄 Starting guide sync to channel ${config.guides.channelId}...`);
      await syncGuidesToChannel(client, config.guides.channelId);
    } catch (error) {
      console.error('❌ Failed to sync guides:', error);
    }
  }
);
