import { Events, Role } from 'discord.js';
import { createEvent } from '@/common/events/create-event.js';
import { config } from '@/env.js';

function isInvalid(val: unknown) {
  return val === undefined || val === null;
}

export const joinRoleAdd = createEvent(
  {
    name: Events.GuildMemberAdd,
  },
  async (member) => {
    const memberRoleID = config.roleIds.member;
    let role: Role | null | undefined =
      member.guild.roles.cache.get(memberRoleID);
    if (isInvalid(role)) {
      role = member.guild.roles.resolve(memberRoleID);
      if (isInvalid(role)) {
        throw new Error(
          'Member role ID configured was not found in guild. Does your role exist?'
        );
      }
    }
    member.roles
      .add(role)
      .then((_) => {
        console.log('Successfully added a role to the new user.');
      })
      .catch((err) => {
        console.error(
          `Failed to add member role to ${member.user.tag}:\n`,
          err,
          "\n\nPossible reasons: Bot role is below the role to be appended or bot role doesn't have the permission to grant roles."
        );
      });
  }
);
