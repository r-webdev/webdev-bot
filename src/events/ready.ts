import { Events } from 'discord.js';
import { createEvent } from '../util/events.js';

export const readyEvent = createEvent(
  {
    name: Events.ClientReady,
    once: true,
  },
  (client) => {
    console.log(`Ready! Logged in as ${client.user.tag}`);
  }
);
