import type { GuildMember } from 'discord.js';

export const hasRoles = (member: GuildMember, ...roles: string[]): boolean => {
  return roles.every((roleId) => member.roles.cache.has(roleId));
};
