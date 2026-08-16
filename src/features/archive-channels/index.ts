import { createEvent } from '@/common/events/create-event.js';
import { config } from '@/env.js';
import { Events, PermissionFlagsBits, type GuildChannel } from 'discord.js';

const PUBLIC_PERMISSIONS = [
  PermissionFlagsBits.SendMessages,
  PermissionFlagsBits.CreatePublicThreads,
  PermissionFlagsBits.CreatePrivateThreads,
  PermissionFlagsBits.SendMessagesInThreads,
  PermissionFlagsBits.Connect,
];

const ARCHIVED_REGEX = /^archived-/;

const processingChannels = new Set<string>();

export default createEvent(
  {
    name: Events.ChannelUpdate,
  },
  async (oldChannel, newChannel) => {
    if (newChannel.isDMBased() || oldChannel.isDMBased()) {
      return;
    }

    // We only care about channels that are being moved to or out of the archived category
    if (
      newChannel.parentId !== config.channelIds.archiveCategory &&
      oldChannel.parentId !== config.channelIds.archiveCategory
    ) {
      return;
    }

    // Prevent deadlocks from nested ChannelUpdate events caused by our own edits
    if (processingChannels.has(newChannel.id)) {
      return;
    }

    if (newChannel.parentId === config.channelIds.archiveCategory) {
      await archiveChannel(newChannel);
    } else {
      await unarchiveChannel(newChannel);
    }
  }
);

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
    console.error(`Error archiving channel ${channelName}:`, error);
  } finally {
    processingChannels.delete(channel.id);
  }
}

async function unarchiveChannel(channel: GuildChannel) {
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

function hasArchivedPermissions(channel: GuildChannel) {
  const everyoneRole = channel.guild.roles.everyone;
  const overwrite = channel.permissionOverwrites.cache.get(everyoneRole.id);

  if (!overwrite) {
    return false;
  }

  return PUBLIC_PERMISSIONS.every((permission) =>
    overwrite.deny.has(permission)
  );
}

async function setArchivedPermissions(
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
