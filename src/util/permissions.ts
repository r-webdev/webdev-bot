import { config } from '@/env.js';
import type { GuildMember } from 'discord.js';

export const isServerOwner = (member: GuildMember): boolean => {
  return member.guild.ownerId === member.id;
};

export const isModerator = (member: GuildMember): boolean => {
  const moderatorRoles = config.roleIds.moderators.map((roleId) =>
    member.guild.roles.cache.get(roleId)
  );
  if (moderatorRoles.length === 0) {
    throw new Error(
      'Moderator role not found in the guild. Please check the configuration.'
    );
  }

  const lowestModeratorRolePosition = moderatorRoles.reduce((lowest, role) => {
    if (!role) {
      throw new Error(
        'Moderator role not found in the guild. Please check the configuration.'
      );
    }
    return role.position < lowest ? role.position : lowest;
  }, Number.MAX_SAFE_INTEGER);

  return member.roles.highest.position >= lowestModeratorRolePosition;
};

export const hasTagAccess = (member: GuildMember): boolean => {
  return member.roles.cache.has(config.roleIds.tagAccess);
};

export const isStaff = (member: GuildMember): boolean => {
  return isServerOwner(member) || isModerator(member);
};
