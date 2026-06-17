import type { Client } from 'discord.js';
import { events } from './index.js';

export const loadEvents = (client: Client) => {
  for (const event of events) {
    console.log(`Loading event: ${event.name}`);
    client[event.once ? 'once' : 'on'](event.name, async (...args) => {
      try {
        await event.execute(...args);
      } catch (error) {
        console.error(`Error executing event ${event.name}:`, error);
      }
    });
  }
};
