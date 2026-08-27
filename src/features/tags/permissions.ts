import type { GuildMember } from 'discord.js';
import { hasTagAccess, isStaff } from '@/util/permissions.js';

export const canAccessTags = (member: GuildMember): boolean => {
  return isStaff(member) || hasTagAccess(member);
};
