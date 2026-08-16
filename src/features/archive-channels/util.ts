import { config } from '@/env.js';
import {
  Guild,
  ChannelType,
  type GuildChannel,
  PermissionFlagsBits,
} from 'discord.js';

export const processingChannels = new Set<string>();

export const ARCHIVED_REGEX = /^archived-/;

export const PUBLIC_PERMISSIONS = [
  PermissionFlagsBits.SendMessages,
  PermissionFlagsBits.CreatePublicThreads,
  PermissionFlagsBits.CreatePrivateThreads,
  PermissionFlagsBits.SendMessagesInThreads,
  PermissionFlagsBits.Connect,
];

export async function syncArchiveCategoryChannels(guild: Guild) {
  const archiveCategory = guild.channels.cache.get(
    config.channelIds.archiveCategory
  );

  if (archiveCategory?.type !== ChannelType.GuildCategory) {
    throw new Error(
      `Archive category with ID ${config.channelIds.archiveCategory} not found in the guild.`
    );
  }

  const archivedChannels = archiveCategory.children.cache;
  const results = await Promise.allSettled(
    archivedChannels.map(archiveChannel)
  );

  const failedReasons = [];
  for (const result of results) {
    if (result.status === 'rejected') {
      failedReasons.push(result.reason);
    }
  }

  if (failedReasons.length > 0) {
    const errorMessages = failedReasons
      .map((reason) => reason.message || reason)
      .join('; ');
    console.error(`Failed to archive some channels: ${errorMessages}`);
    throw new Error(`Failed to archive some channels: ${errorMessages}`);
  }
}
export async function setArchivedPermissions(
  channel: GuildChannel,
  archived: boolean
) {
  await channel.permissionOverwrites.edit(
    channel.guild.roles.everyone.id,
    {
      SendMessages: archived ? false : null,
      CreatePublicThreads: archived ? false : null,
      CreatePrivateThreads: archived ? false : null,
      SendMessagesInThreads: archived ? false : null,
      Connect: archived ? false : null,
    },
    {
      reason: `${archived ? 'Archiving' : 'Unarchiving'} channel ${channel.name}`,
    }
  );
}
export function hasArchivedPermissions(channel: GuildChannel) {
  const everyoneRole = channel.guild.roles.everyone;
  const overwrite = channel.permissionOverwrites.cache.get(everyoneRole.id);

  if (!overwrite) {
    return false;
  }

  return PUBLIC_PERMISSIONS.every((permission) =>
    overwrite.deny.has(permission)
  );
}
export async function unarchiveChannel(channel: GuildChannel) {
  const channelName = channel.name;

  if (!channelName.match(ARCHIVED_REGEX)) {
    return;
  }

  const newChannelName = channelName.replace(ARCHIVED_REGEX, '');

  processingChannels.add(channel.id);

  try {
    await setArchivedPermissions(channel, false);
    await channel.setName(newChannelName);
  } catch (error) {
    console.error(
      `Error unarchiving channel ${channelName}:`,
      (error as Error).message
    );
  } finally {
    processingChannels.delete(channel.id);
  }
}
export async function archiveChannel(channel: GuildChannel) {
  const channelName = channel.name;

  const archivedChannelName = channelName.match(ARCHIVED_REGEX)
    ? channelName
    : `archived-${channelName}`;

  if (archivedChannelName === channelName && hasArchivedPermissions(channel)) {
    return;
  }

  processingChannels.add(channel.id);

  try {
    const renamedChannel = await channel.setName(archivedChannelName);
    await setArchivedPermissions(renamedChannel, true);
  } catch (error) {
    // console.error(`Error archiving channel ${channelName}:`, error);
    throw new Error(
      `Error archiving channel ${channelName}: ${(error as Error).message}`
    );
  } finally {
    processingChannels.delete(channel.id);
  }
}
