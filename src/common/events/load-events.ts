import type { Client } from 'discord.js';
import { events } from './index.js';
import { createLogger } from '@/util/logger.js';

const logger = createLogger('events');

export const loadEvents = (client: Client) => {
  for (const event of events) {
    logger.log(`Loading event: ${event.name}`);
    client[event.once ? 'once' : 'on'](event.name, async (...args) => {
      try {
        await event.execute(...args);
      } catch (error) {
        logger.error(`Error executing event ${event.name}:`, error);
      }
    });
  }
};
