import { createEvent } from '@/common/events/create-event.js';
import { config } from '@/env.js';
import { Events } from 'discord.js';
import {
  archiveChannel,
  processingChannels,
  unarchiveChannel,
} from './util.js';

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
