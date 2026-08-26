import {
  type APIInteractionGuildMember,
  type BaseInteraction,
  GuildMember,
  PermissionFlagsBits,
  type User,
} from 'discord.js';
import { config } from '@/env.js';

export const hasAllRoles = (
  member: GuildMember,
  ...roles: string[]
): boolean => {
  return roles.every((roleId) => member.roles.cache.has(roleId));
};

export const hasAnyRole = (
  member: GuildMember,
  ...roles: string[]
): boolean => {
  return roles.some((roleId) => member.roles.cache.has(roleId));
};

export const isUserInServer = (
  target: User | GuildMember | null | APIInteractionGuildMember
): target is GuildMember => {
  return target instanceof GuildMember;
};

export const isUserModerator = (
  member: GuildMember,
  interaction: BaseInteraction
): boolean => {
  return (
    hasAnyRole(member, ...config.roleIds.moderators) ||
    member.permissions.has(
      PermissionFlagsBits.Administrator | PermissionFlagsBits.ModerateMembers
    ) ||
    interaction.guild?.ownerId === member.id
  );
};

export const getCommandUser = (interaction: BaseInteraction): GuildMember => {
  const commandUser = interaction.member;
  if (commandUser instanceof GuildMember) {
    return commandUser;
  }
  throw new Error(
    'Command user is not a GuildMember. This should never happen since commands can only be used in guilds.'
  );
};
