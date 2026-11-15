// @ts-nocheck: This event isn't used and shouldn't affect anything, auto-roles are TBD
// This requires the GuildMembers intent, which is not enabled in the bot's configuration.

import { Events } from 'discord.js';
import { createEvent } from '@/common/events/create-event.js';
import { config } from '@/env.js';
import { hasAllRoles } from '@/util/member.js';
import { createLogger } from '@/util/logger.js';

const logger = createLogger('auto-roles');

export const autoRoleEvent = createEvent(
  {
    name: Events.GuildMemberUpdate,
  },
  async (_, newMember) => {
    const hasRoleC = hasAllRoles(newMember, config.roleIds.c);
    if (!hasRoleC) {
      const hasRequiredRoles = hasAllRoles(
        newMember,
        config.roleIds.a,
        config.roleIds.b
      );
      if (hasRequiredRoles) {
        try {
          await newMember.roles.add(config.roleIds.c);
        } catch (error) {
          logger.error(`Failed to add roleC to ${newMember.user.tag}:`, error);
        }
      }
    }
  }
);
