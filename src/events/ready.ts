import { Events } from 'discord.js';
import { createEvent } from './index.js';

export default createEvent(
  {
    name: Events.ClientReady,
    once: true,
  },
  (client) => {
    console.log(`Ready! Logged in as ${client.user.tag}`);
  }
);
