#!/usr/bin/env node

/**
 * Standalone script for synchronizing guides to Discord channel
 * Usage: npm run sync-guides [--initialize]
 */

import { Client, GatewayIntentBits } from 'discord.js';
import { config } from '../src/env.js';
import { syncGuidesToChannel, initializeGuidesChannel } from '../src/util/post-guides.js';

async function main() {
  const args = process.argv.slice(2);
  const shouldInitialize = args.includes('--initialize');

  if (!config.guides.channelId) {
    console.error('❌ GUIDES_CHANNEL_ID environment variable is required');
    console.error('Please set it in your environment variables');
    process.exit(1);
  }

  console.log(`🤖 Starting Discord client for guide sync...`);
  
  const client = new Client({
    intents: [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildMessages,
    ],
  });

  try {
    await client.login(config.discord.token);
    console.log(`✅ Logged in as ${client.user?.tag}`);

    if (shouldInitialize) {
      console.log('🚀 Initializing guides channel (will post all guides fresh)...');
      await initializeGuidesChannel(client, config.guides.channelId);
    } else {
      console.log('🔄 Synchronizing guides...');
      await syncGuidesToChannel(client, config.guides.channelId);
    }

    console.log('✅ Guide synchronization completed successfully');
  } catch (error) {
    console.error('❌ Guide synchronization failed:', error);
    process.exit(1);
  } finally {
    await client.destroy();
    console.log('👋 Discord client disconnected');
  }
}

main().catch((error) => {
  console.error('❌ Unexpected error:', error);
  process.exit(1);
});