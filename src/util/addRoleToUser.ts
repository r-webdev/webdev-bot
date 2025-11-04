import {
  type ButtonInteraction,
  type CacheType,
  type ChannelSelectMenuInteraction,
  type GuildMember,
  type MentionableSelectMenuInteraction,
  MessageFlags,
  type Role,
  type RoleSelectMenuInteraction,
  type StringSelectMenuInteraction,
  type UserSelectMenuInteraction,
} from 'discord.js';

type ComponentInteraction =
  | ButtonInteraction<CacheType>
  | StringSelectMenuInteraction<CacheType>
  | UserSelectMenuInteraction<CacheType>
  | RoleSelectMenuInteraction<CacheType>
  | MentionableSelectMenuInteraction<CacheType>
  | ChannelSelectMenuInteraction<CacheType>;

export async function addRoleToUser(
  member: GuildMember,
  role: Role,
  interaction: ComponentInteraction
) {
  const hasRole = member.roles.cache.has(role.id);
  if (hasRole) {
    await interaction.reply({
      content: `You already have the ${role.name} role.`,
      flags: MessageFlags.Ephemeral,
    });
  } else {
    await member.roles.add(role);
    await interaction.reply({
      content: `You have been given the ${role.name} role!`,
      flags: MessageFlags.Ephemeral,
    });
  }
}
