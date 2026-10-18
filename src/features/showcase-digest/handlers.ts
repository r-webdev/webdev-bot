import { SERVER_CHANNELS } from '@/constants/channels.js';
import { config } from '@/env.js';
import { getCommandUser } from '@/util/member.js';
import { isModerator } from '@/util/permissions.js';
import { LOOKBACK_N, REACT_EMOJI } from './config.js';
import {
  ButtonInteraction,
  ChatInputCommandInteraction,
  Collection,
  MessageFlags,
  ContainerBuilder,
  TextDisplayBuilder,
  ForumThreadChannel,
  channelMention,
  roleMention,
} from 'discord.js';
import {
  convertPosts,
  filterPostsByCreationTime,
  type Post,
  LEVEL,
  ShowcaseDigestValidationError,
} from './util.js';

const postProcessor = async (posts: Collection<string, ForumThreadChannel>) => {
  const postsUnordered: Post[] = await convertPosts(posts, REACT_EMOJI);
  const byLikesDescending = (postA: Post, postB: Post) => {
    return postB.likes - postA.likes;
  };
  return postsUnordered.sort(byLikesDescending);
};

function createContainer(posts: Post[]): ContainerBuilder {
  if (posts.length == 0) {
    throw new ShowcaseDigestValidationError(
      'Something went wrong. Please try again later.',
      'createContainer passed posts[] with length 0. Impossible scenario.',
      LEVEL.SEVERE
    );
  }

  const container = new ContainerBuilder();
  container.addTextDisplayComponents(
    new TextDisplayBuilder().setContent('## Showcase Digest')
  );

  posts.forEach((post, index) => {
    container.addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        `${index + 1}. ${channelMention(post.id)} (Comments: ${post.messageCount})`
      )
    );
  });

  container.addTextDisplayComponents(
    new TextDisplayBuilder().setContent(
      `-# ${roleMention(config.roleIds.digestRole)}`
    )
  );

  return container;
}

export const createShowcaseDigest = async (): Promise<void> => {
  const digestChannel = SERVER_CHANNELS.showcaseDigest;
  const forumChannel = SERVER_CHANNELS.showcase;
  const posts = filterPostsByCreationTime(
    forumChannel.threads.cache,
    LOOKBACK_N
  );

  if (posts.size === 0) {
    throw new ShowcaseDigestValidationError(
      'There was no posts to display in this digest.'
    );
  }

  const postsOrdered: Post[] = await postProcessor(posts);
  const container = createContainer(postsOrdered);

  await digestChannel.send({
    flags: MessageFlags.IsComponentsV2,
    components: [container],
    allowedMentions: { roles: [config.roleIds.digestRole] },
  });
};

export const digestHandler = async (
  interaction: ButtonInteraction | ChatInputCommandInteraction
) => {
  if (!interaction.inGuild() || !interaction.guild) {
    await interaction.reply({
      content: 'This command can only be run in the web development discord.',
      flags: MessageFlags.Ephemeral,
    });
    return;
  }

  if (!isModerator(getCommandUser(interaction))) {
    await interaction.reply({
      content: 'Only moderators can run the showcase digest.',
      flags: MessageFlags.Ephemeral,
    });
    return;
  }

  try {
    await createShowcaseDigest();
  } catch (error: unknown) {
    if (error instanceof ShowcaseDigestValidationError) {
      error.logError();
      await interaction.reply({
        flags: MessageFlags.Ephemeral,
        content: error.getUserMessage(),
      });
    } else {
      console.error('An unexpected error caught:', error);
      await interaction.reply({
        flags: MessageFlags.Ephemeral,
        content: 'Something went wrong, please try again.',
      });
    }
    return;
  }

  await interaction.reply({
    flags: MessageFlags.Ephemeral,
    content: 'Successfully created a showcase digest!',
  });
};
