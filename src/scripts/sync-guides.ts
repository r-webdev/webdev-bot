#!/usr/bin/env node

/**
 * Standalone script for synchronizing guides to Discord channel
 * Usage: npm run sync-guides [--initialize]
 */

import { Client, GatewayIntentBits } from 'discord.js';
import { config } from '@/env.js';
import {
  initializeGuidesChannel,
  syncGuidesToChannel,
} from '@/util/post-guides.js';
import { createLogger } from '@/util/logger.js';

const logger = createLogger('guides');

async function main() {
  const args = process.argv.slice(2);
  const shouldInitialize = args.includes('--initialize');

  if (!config.channelIds.guides) {
    logger.error('❌ GUIDES_CHANNEL_ID environment variable is required');
    logger.error('Please set it in your environment variables');
    process.exit(1);
  }

  logger.log(`🤖 Starting Discord client for guide sync...`);

  const client = new Client({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages],
  });

  try {
    await client.login(config.discord.token);
    logger.log(`✅ Logged in as ${client.user?.tag}`);

    if (shouldInitialize) {
      logger.log(
        '🚀 Initializing guides channel (will post all guides fresh)...'
      );
      await initializeGuidesChannel(client, config.channelIds.guides);
    } else {
      logger.log('🔄 Synchronizing guides...');
      await syncGuidesToChannel(client, config.channelIds.guides);
    }

    logger.log('✅ Guide synchronization completed successfully');
  } catch (error) {
    logger.error('❌ Guide synchronization failed:', error);
    process.exit(1);
  } finally {
    await client.destroy();
    logger.log('👋 Discord client disconnected');
  }
}

main().catch((error) => {
  logger.error('❌ Unexpected error:', error);
  process.exit(1);
});
