import { SERVER_CHANNELS } from '@/constants/channels.js';
import { config } from '@/env.js';
import { getCommandUser } from '@/util/member.js';
import { isModerator } from '@/util/permissions.js';
import {
  LOOKBACK_N,
  MAX_VOTABLE_POSTS,
  REACT_EMOJI,
  RESULTS_AFTER_DAYS,
  VOTE_EMOJIS,
} from './config.js';
import { DAY } from '@/constants/time.js';
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
  isDigestMessage,
  isResultsMessage,
  parseDigestPostIds,
  rankVoteResults,
  tallyDigestVotes,
  type Post,
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
      'createContainer passed posts[] with length 0. Impossible scenario.'
    );
  }

  const container = new ContainerBuilder();
  container.addTextDisplayComponents(
    new TextDisplayBuilder().setContent('## Showcase Digest')
  );

  const votablePosts = posts.slice(0, MAX_VOTABLE_POSTS);
  votablePosts.forEach((post, index) => {
    container.addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        `${index + 1}. ${channelMention(post.id)} (Comments: ${post.messageCount}) ${VOTE_EMOJIS[index]}`
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
      'There was no posts to be displayed in Showcase Digest.',
      'There was no posts to display in this digest.'
    );
  }

  const postsOrdered: Post[] = await postProcessor(posts);
  const container = createContainer(postsOrdered);

  const message = await digestChannel.send({
    flags: MessageFlags.IsComponentsV2,
    components: [container],
    allowedMentions: { roles: [config.roleIds.digestRole] },
  });

  // Seed one reaction per votable post so members can vote. Reactions are added
  // sequentially to keep them in rank order on the message.
  const votableCount = Math.min(postsOrdered.length, MAX_VOTABLE_POSTS);
  for (let index = 0; index < votableCount; index += 1) {
    await message.react(VOTE_EMOJIS[index]);
  }
};

export const processShowcaseDigestResults = async (
  options: { force?: boolean } = {}
): Promise<void> => {
  const digestChannel = SERVER_CHANNELS.showcaseDigest;
  const recentMessages = await digestChannel.messages.fetch({ limit: 50 });
  const botId = digestChannel.client.user.id;

  const digestMessage = recentMessages.find(
    (message) => message.author.id === botId && isDigestMessage(message)
  );

  if (!digestMessage) {
    throw new ShowcaseDigestValidationError(
      'No showcase digest found to process for results.',
      'There is no recent showcase digest to process.'
    );
  }

  // A forced run skips the timing and duplicate guards so a moderator can
  // announce results on demand.
  if (!options.force) {
    const ageMs = Date.now() - digestMessage.createdTimestamp;
    const isDue =
      ageMs >= RESULTS_AFTER_DAYS * DAY &&
      ageMs < (RESULTS_AFTER_DAYS + 1) * DAY;
    if (!isDue) {
      console.log(
        'Most recent showcase digest is not within the results window, skipping.'
      );
      return;
    }

    const alreadyAnnounced = recentMessages.some(
      (message) =>
        message.author.id === botId &&
        isResultsMessage(message) &&
        message.createdTimestamp > digestMessage.createdTimestamp
    );
    if (alreadyAnnounced) {
      console.log('Showcase digest results have already been announced.');
      return;
    }
  }

  const postIds = parseDigestPostIds(digestMessage);
  if (postIds.length === 0) {
    throw new ShowcaseDigestValidationError(
      'Could not recover any posts from the showcase digest.',
      'Could not read any posts from the latest showcase digest.'
    );
  }

  const results = rankVoteResults(
    tallyDigestVotes(postIds, digestMessage.reactions.cache)
  );

  const container = new ContainerBuilder();
  container.addTextDisplayComponents(
    new TextDisplayBuilder().setContent('## Showcase Digest Results')
  );

  const winningVotes = results[0]?.votes ?? 0;
  results.forEach((result, index) => {
    const isWinner = winningVotes > 0 && result.votes === winningVotes;
    const voteLabel = result.votes === 1 ? 'vote' : 'votes';
    const line = `${index + 1}. ${channelMention(result.postId)} - ${result.votes} ${voteLabel}`;
    container.addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        isWinner ? `**${line} (winner)**` : line
      )
    );
  });

  await digestChannel.send({
    flags: MessageFlags.IsComponentsV2,
    components: [container],
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
      console.error(error.message);
      await interaction.reply({
        flags: MessageFlags.Ephemeral,
        content: error.getExternalMessage(),
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

export const digestResultsHandler = async (
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
      content: 'Only moderators can run the showcase digest results.',
      flags: MessageFlags.Ephemeral,
    });
    return;
  }

  try {
    await processShowcaseDigestResults({ force: true });
  } catch (error: unknown) {
    if (error instanceof ShowcaseDigestValidationError) {
      console.error(error.message);
      await interaction.reply({
        flags: MessageFlags.Ephemeral,
        content: error.getExternalMessage(),
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
    content: 'Successfully announced the showcase digest results!',
  });
};
