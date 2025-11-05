import { Events } from 'discord.js';
import { config } from '../env.js';
import { createEvent } from '../util/events.js';
import { hasRoles } from '../util/member.js';

export const autoRoleEvent = createEvent(
  {
    name: Events.GuildMemberUpdate,
  },
  async (_, newMember) => {
    const hasRoleC = hasRoles(newMember, config.roleC);
    if (!hasRoleC) {
      const hasRequiredRoles = hasRoles(newMember, config.roleA, config.roleB);
      if (hasRequiredRoles) {
        try {
          await newMember.roles.add(config.roleC);
        } catch (error) {
          console.error(`Failed to add roleC to ${newMember.user.tag}:`, error);
        }
      }
    }
  }
);
