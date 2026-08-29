import { ActivityType, Client, GatewayIntentBits } from 'discord.js';
import { loadEvents } from './common/events/load-events.js';
import { config } from './env.js';
import { isArchiveRateLimit } from './util/rate-limits.js';

const client = new Client({
  rest: {
    timeout: 60_000,
    rejectOnRateLimit: (rateLimitData) => {
      if (isArchiveRateLimit(rateLimitData)) {
        return true;
      }
      return false;
    },
  },
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildModeration,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.GuildExpressions,
    GatewayIntentBits.GuildMessageReactions,
    GatewayIntentBits.GuildMessageTyping,
  ],
  presence: {
    activities: [
      { type: ActivityType.Custom, name: 'Helping you out in the community' },
    ],
    status: 'online',
  },
});

loadEvents(client);

void client.login(config.discord.token);
