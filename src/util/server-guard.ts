import type { Guild } from 'discord.js';
import { config } from '@/env.js';
import { createLogger } from '@/util/logger.js';

const logger = createLogger('server-guard');

/**
 * Checks if a guild is the allowed server
 */
export function isAllowedServer(guildId: string): boolean {
  return guildId === config.discord.serverId;
}

/**
 * Leaves a guild if it's not the allowed server
 * @returns true if the bot left the guild, false if it stayed
 */
export async function leaveIfNotAllowedServer(guild: Guild): Promise<boolean> {
  if (!isAllowedServer(guild.id)) {
    logger.log(
      `⚠️ Bot added to unauthorized server: ${guild.name} (${guild.id})`
    );
    logger.log(`🚪 Leaving server...`);
    await guild.leave();
    logger.log(`✅ Left unauthorized server: ${guild.name}`);
    return true;
  }
  return false;
}
