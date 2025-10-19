import { Events } from 'discord.js';
import { createEvent } from '../util/events.js';
import { leaveIfNotAllowedServer } from '../util/server-guard.js';

export const guildCreateEvent = createEvent(
  {
    name: Events.GuildCreate,
  },
  async (guild) => {
    // Leave the server if it's not the allowed one
    await leaveIfNotAllowedServer(guild);
  }
);
