import {
  ApplicationCommandOptionType,
  ApplicationCommandType,
  ChannelType,
  type ChatInputCommandInteraction,
  EmbedBuilder,
  GuildMember,
  MessageFlags,
  PermissionFlagsBits,
  type Role,
  type TextChannel,
  type User,
} from 'discord.js';
import { HOUR, MINUTE, timeToString } from '../../constants/time.js';
import { config } from '../../env.js';
import { getPublicChannels } from '../../util/channel.js';
import { logToChannel } from '../../util/channel-logging.js';
import { buildCommandString, createCommand } from '../../util/commands.js';

const DEFAULT_LOOK_BACK = 10 * MINUTE;
const DEFAULT_TIMEOUT_DURATION = 1 * HOUR;

const isUserInServer = (target: User | GuildMember): target is GuildMember => {
  return target instanceof GuildMember;
};

const isUserTimedOut = (target: GuildMember) => {
  return target.communicationDisabledUntilTimestamp
    ? target.communicationDisabledUntilTimestamp > Date.now()
    : false;
};

const checkCanRepel = ({
  commandUser,
  repelRole,
}: {
  commandUser: GuildMember;
  repelRole: Role;
}): {
  ok: boolean;
  message?: string;
} => {
  const hasPermission =
    commandUser.permissions.has(PermissionFlagsBits.ModerateMembers) ||
    commandUser.roles.cache.has(repelRole.id);
  if (!hasPermission) {
    return { ok: false, message: 'You do not have permission to use this command.' };
  }
  return { ok: true };
};

const checkCanRepelTarget = ({
  target,
  commandUser,
  botMember,
}: {
  target: User | GuildMember;
  commandUser: GuildMember;
  botMember: GuildMember;
}): {
  ok: boolean;
  message?: string;
} => {
  if (!isUserInServer(target)) {
    return { ok: true };
  }

  if (target.user.bot) {
    return { ok: false, message: 'You cannot repel a bot.' };
  }

  if (target.id === commandUser.id) {
    return { ok: false, message: 'You cannot repel yourself.' };
  }

  const isTargetServerOwner = target.id === target.guild.ownerId;
  if (isTargetServerOwner) {
    return { ok: false, message: 'You cannot repel the server owner.' };
  }

  if (target.roles.highest.position >= commandUser.roles.highest.position) {
    return { ok: false, message: 'You cannot repel this user due to role hierarchy.' };
  }

  if (target.roles.highest.position >= botMember.roles.highest.position) {
    return { ok: false, message: 'I cannot repel this user due to role hierarchy.' };
  }

  return { ok: true };
};

const getTargetFromInteraction = async (
  interaction: ChatInputCommandInteraction
): Promise<GuildMember | User> => {
  const targetFromOption = interaction.options.getUser(RepelOptions.TARGET, true);
  let target: User | GuildMember | null = null;
  if (!interaction.inGuild() || interaction.guild === null) {
    return targetFromOption;
  }
  try {
    target = await interaction.guild.members.fetch(targetFromOption.id);
  } catch {
    target = targetFromOption;
  }
  return target;
};

const handleTimeout = async ({
  target,
  duration,
}: {
  target: GuildMember | User;
  duration: number;
}): Promise<number> => {
  if (duration === 0 || !isUserInServer(target) || isUserTimedOut(target)) {
    return 0;
  }
  try {
    await target.timeout(duration * HOUR, 'Repel command executed');
    return duration;
  } catch {
    return 0;
  }
};

const getTextChannels = (interaction: ChatInputCommandInteraction) => {
  if (!interaction.inGuild() || !interaction.guild) {
    return [];
  }
  const channels = getPublicChannels(interaction.guild).map((c) => c);
  return channels;
};

const handleDeleteMessages = async ({
  target,
  channels,
  lookBack,
}: {
  target: GuildMember | User;
  channels: TextChannel[];
  lookBack: number;
}) => {
  let deleted = 0;
  await Promise.all(
    channels.map(async (channel) => {
      try {
        const messages = channel.messages.cache;
        const targetMessages = messages
          .filter(
            (message) =>
              message.author.id === target.id &&
              message.deletable &&
              Date.now() - message.createdTimestamp < lookBack
          )
          .first(10);

        if (targetMessages.length === 0) {
          return;
        }
        await channel.bulkDelete(targetMessages, true);
        deleted += targetMessages.length;
      } catch {}
    })
  );
  return deleted;
};

const logRepelAction = async ({
  interaction,
  member,
  target,
  duration,
  deleteCount,
  reason,
}: {
  interaction: ChatInputCommandInteraction;
  member: GuildMember;
  target: User | GuildMember;
  reason: string;
  duration?: number;
  deleteCount: number;
}) => {
  const channelInfo =
    interaction.channel?.type === ChannelType.GuildVoice
      ? `**${interaction.channel.name}** voice chat`
      : `<#${interaction.channelId}>`;
  const memberAuthor = {
    name: member.user.tag,
    iconURL: member.user.displayAvatarURL(),
  };
  const targetAuthor = {
    name: isUserInServer(target)
      ? `${target.user.tag} | Repel | ${target.user.username}`
      : `${target.tag} | Repel | ${target.username}`,
    iconURL: isUserInServer(target) ? target.user.displayAvatarURL() : target.displayAvatarURL(),
  };

  const commandEmbed = new EmbedBuilder()
    .setAuthor(memberAuthor)
    .setDescription(`Used \`repel\` command in ${channelInfo}.\n${buildCommandString(interaction)}`)
    .setColor('Green')
    .setTimestamp();
  const resultEmbed = new EmbedBuilder()
    .setAuthor(targetAuthor)
    .addFields(
      {
        name: 'Target',
        value: `<@${target.id}>`,
        inline: true,
      },
      {
        name: 'Moderator',
        value: `<@${member.id}>`,
        inline: true,
      },
      {
        name: 'Reason',
        value: reason,
        inline: true,
      },
      {
        name: 'Deleted Messages',
        value: deleteCount.toString(),
        inline: true,
      },
      {
        name: 'Timeout Duration',
        value: duration ? `${timeToString(duration)}` : 'No Timeout',
        inline: true,
      }
    )
    .setColor('Orange')
    .setTimestamp();

  const modMessage = interaction.options.getString(RepelOptions.MESSAGE_FOR_MODS) ?? false;
  const mentionText = modMessage
    ? `${config.moderatorsRoleIds.map((id) => `<@&${id}>`)} - ${modMessage}`
    : undefined;
  const channel = interaction.client.channels.cache.get(
    config.repel.repelLogChannelId
  ) as TextChannel;
  await logToChannel({
    channel,
    content: {
      type: 'embed',
      embed: [commandEmbed, resultEmbed],
      content: mentionText,
    },
  });
};

const RepelOptions = {
  TARGET: 'target',
  REASON: 'reason',
  LOOK_BACK: 'look_back',
  TIMEOUT_DURATION: 'timeout_duration',
  MESSAGE_FOR_MODS: 'message_for_mods',
} as const;

export const repelCommand = createCommand({
  data: {
    name: 'repel',
    type: ApplicationCommandType.ChatInput,
    description: 'Remove recent messages and timeout a user',
    options: [
      {
        name: RepelOptions.TARGET,
        required: true,
        type: ApplicationCommandOptionType.User,
        description: 'The user to timeout and remove messages from',
      },
      {
        name: RepelOptions.REASON,
        required: true,
        type: ApplicationCommandOptionType.String,
        description: 'Reason for the timeout and message removal',
      },
      {
        name: RepelOptions.LOOK_BACK,
        required: false,
        type: ApplicationCommandOptionType.Integer,
        description: `Number of recent messages to delete (default: ${timeToString(DEFAULT_LOOK_BACK)})`,
        choices: [
          {
            name: '10 minutes (Default)',
            value: 10 * MINUTE,
          },
          {
            name: '30 minutes',
            value: 30 * MINUTE,
          },
          {
            name: '1 hour',
            value: 1 * HOUR,
          },
          {
            name: '3 hours',
            value: 3 * HOUR,
          },
        ],
      },
      {
        name: RepelOptions.TIMEOUT_DURATION,
        required: false,
        type: ApplicationCommandOptionType.Integer,
        description: `Duration of the timeout in hours (default: ${timeToString(DEFAULT_TIMEOUT_DURATION)})`,
        min_value: 1,
        max_value: 24,
      },
      {
        name: RepelOptions.MESSAGE_FOR_MODS,
        required: false,
        type: ApplicationCommandOptionType.String,
        description: 'Optional message to include for moderators in the log',
      },
    ],
  },
  execute: async (interaction) => {
    if (!interaction.inGuild() || !interaction.guild) {
      await interaction.reply({
        content: 'This command can only be used in a server.',
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    if (!interaction.isChatInputCommand()) {
      return;
    }
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    const repelRole = interaction.guild.roles.cache.get(config.repel.repelRoleId);
    if (!repelRole) {
      await interaction.editReply({
        content: '❌ Repel role is not configured correctly. Please contact an administrator.',
      });
      return;
    }

    const target = await getTargetFromInteraction(interaction);

    const commandUser = interaction.member as GuildMember;

    const canRepel = checkCanRepel({ commandUser, repelRole });
    if (!canRepel.ok) {
      await interaction.editReply({ content: `❌ ${canRepel.message}` });
      return;
    }

    const botMember = interaction.guild.members.me;
    if (!botMember) {
      await interaction.editReply({
        content: '❌ Unable to verify my permissions in the server.',
      });
      return;
    }

    const canRepelTarget = checkCanRepelTarget({
      target,
      commandUser,
      botMember,
    });
    if (!canRepelTarget.ok) {
      await interaction.editReply({ content: `❌ ${canRepelTarget.message}` });
      return;
    }

    try {
      const reason = interaction.options.getString(RepelOptions.REASON, true);
      const lookBack = interaction.options.getInteger(RepelOptions.LOOK_BACK);
      const timeoutDuration = interaction.options.getInteger(RepelOptions.TIMEOUT_DURATION);

      const timeout = await handleTimeout({
        target: target,
        duration: timeoutDuration ? timeoutDuration * HOUR : DEFAULT_TIMEOUT_DURATION,
      });

      const channels = getTextChannels(interaction);

      const deleted = await handleDeleteMessages({
        channels,
        target: target,
        lookBack: lookBack ?? DEFAULT_LOOK_BACK,
      });

      logRepelAction({
        interaction,
        member: commandUser,
        target,
        reason,
        duration: timeout,
        deleteCount: deleted,
      });

      await interaction.editReply({
        content: `Deleted ${deleted} message(s).`,
      });
    } catch (error) {
      console.error('Error executing repel command:', error);
    }
  },
});
