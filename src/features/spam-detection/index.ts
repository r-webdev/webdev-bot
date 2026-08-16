import { Events } from 'discord.js';
import { createEvent } from '@/common/events/create-event.js';
import { config } from '@/env.js';

export const spamDetection = createEvent(
  {
    name: Events.MessageCreate,
  },
  async (interaction) => {}
);
