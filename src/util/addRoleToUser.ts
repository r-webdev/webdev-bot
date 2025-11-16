import type { GuildMember, Role } from 'discord.js';

export async function addRoleToUser(member: GuildMember, role: Role): Promise<void> {
  const hasRole = member.roles.cache.has(role.id);
  if (!hasRole) {
    try {
      await member.roles.add(role);
    } catch (error) {
      throw new Error(
        `Failed to add role "${role.name}" to user "${member.user.username}": ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }
}
