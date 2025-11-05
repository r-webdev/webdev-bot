import type { GuildMember } from 'discord.js';

export const memberHasRoles = (member: GuildMember, ...roles: string[]): boolean => {
  return roles.every((roleId) => member.roles.cache.has(roleId));
};
