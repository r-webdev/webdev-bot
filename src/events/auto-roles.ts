import { Events } from 'discord.js';
import { config } from '../env.js';
import { createEvent } from '../util/events.js';
import { hasRoles } from '../util/member.js';

export const autoRoleEvent = createEvent(
  {
    name: Events.GuildMemberUpdate,
  },
  async (_, newMember) => {
    const hasRoleC = hasRoles(newMember, config.roleIds.c);
    if (!hasRoleC) {
      const hasRequiredRoles = hasRoles(newMember, config.roleIds.a, config.roleIds.b);
      if (hasRequiredRoles) {
        try {
          await newMember.roles.add(config.roleIds.c);
        } catch (error) {
          console.error(`Failed to add roleC to ${newMember.user.tag}:`, error);
        }
      }
    }
  }
);
