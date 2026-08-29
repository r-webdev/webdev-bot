import { RateLimitData } from 'discord.js';

export function isArchiveRateLimit(rateLimitData: RateLimitData) {
  console.log({ rateLimitData });
  return (
    rateLimitData.route === '/channels/:id' &&
    rateLimitData.method === 'PATCH' &&
    rateLimitData.scope === 'shared'
  );
}
