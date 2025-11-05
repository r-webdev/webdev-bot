import { Events } from 'discord.js';
import { config } from '../env.js';
import { createEvent } from '../util/events.js';
import { memberHasRoles } from '../util/member.js';

export const autoRoleEvent = createEvent(
  {
    name: Events.GuildMemberUpdate,
  },
  async (_, newMember) => {
    const hasRoleC = memberHasRoles(newMember, config.roleC);
    if (hasRoleC) {
      return;
    }
    const hasRequiredRoles = memberHasRoles(newMember, config.roleA, config.roleB);
    if (hasRequiredRoles) {
      try {
        await newMember.roles.add(config.roleC);
      } catch (error) {
        console.error(`Failed to add roleC to ${newMember.user.tag}:`, error);
      }
    }
  }
);
