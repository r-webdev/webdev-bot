import {
  type APIInteractionGuildMember,
  type BaseInteraction,
  GuildMember,
  PermissionFlagsBits,
  type User,
} from 'discord.js';
import { config } from '@/env.js';

export const hasAllRoles = (member: GuildMember, ...roles: string[]): boolean => {
  return roles.every((roleId) => member.roles.cache.has(roleId));
};

export const hasAnyRole = (member: GuildMember, ...roles: string[]): boolean => {
  return roles.some((roleId) => member.roles.cache.has(roleId));
};

export const isUserInServer = (
  target: User | GuildMember | null | APIInteractionGuildMember
): target is GuildMember => {
  return target instanceof GuildMember;
};

export const isUserModerator = (member: GuildMember, interaction: BaseInteraction): boolean => {
  return (
    hasAnyRole(member, ...config.roleIds.moderators) ||
    member.permissions.has(
      PermissionFlagsBits.Administrator | PermissionFlagsBits.ModerateMembers
    ) ||
    interaction.guild?.ownerId === member.id
  );
};
