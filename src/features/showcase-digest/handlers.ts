import { SERVER_CHANNELS } from '@/constants/channels.js';
import { LOOKBACK_N, REACT_EMOJI } from './config.js';
import {
  ButtonInteraction,
  ChatInputCommandInteraction,
  Collection,
  MessageFlags,
  ContainerBuilder,
  TextDisplayBuilder,
  TextChannel,
  ForumThreadChannel,
  channelMention,
} from 'discord.js';
import { convertPosts, filterPostsByCreationTime, type Post } from './util.js';

const postProcessor = async (posts: Collection<string, ForumThreadChannel>) => {
  const postsUnordered: Post[] = await convertPosts(posts, REACT_EMOJI);
  const sortByDescPost = (postA: Post, postB: Post) =>
    postB.likes - postA.likes;
  return postsUnordered.sort(sortByDescPost);
};

/* This function expects a non-empty posts */
function createContainer(posts: Post[]): ContainerBuilder {
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

  return container;
}

/**
 * Builds and posts the showcase digest to the digest channel without an
 * interaction, so it can be driven by the scheduler. Relies on channels already
 * resolved into SERVER_CHANNELS at ready.
 */
export const runShowcaseDigest = async (): Promise<'sent' | 'empty'> => {
  const digestChannel = SERVER_CHANNELS.showcaseDigest as TextChannel;
  const forumChannel = SERVER_CHANNELS.showcase;
  const posts = filterPostsByCreationTime(
    forumChannel.threads.cache,
    LOOKBACK_N
  );

  if (posts.size === 0) {
    console.warn('No posts found.');
    return 'empty';
  }

  const postsOrdered: Post[] = await postProcessor(posts);

  if (postsOrdered.length === 0) {
    console.warn('Showcases Forum was empty!');
    return 'empty';
  }

  await digestChannel.send({
    flags: MessageFlags.IsComponentsV2,
    components: [createContainer(postsOrdered)],
  });
  return 'sent';
};

export const digestHandler = async (
  interaction: ButtonInteraction | ChatInputCommandInteraction
) => {
  if (!interaction.inGuild() || !interaction.guild) {
    // This might need an upgrade? I don't think its handled correctly.
    console.error(
      'Failure from command interaction on showcaseDigest: No guild present'
    );
    await interaction.reply({
      content:
        'There was an error processing the digest. Please try again later.',
      flags: MessageFlags.Ephemeral,
    });
    return;
  }

  const digestChannel = SERVER_CHANNELS.showcaseDigest as TextChannel;
  const forumChannel = SERVER_CHANNELS.showcase;
  const posts = filterPostsByCreationTime(
    forumChannel.threads.cache,
    LOOKBACK_N
  );

  if (posts.size === 0) {
    console.warn('No posts found.');
    await interaction.reply('No posts were found.');
    return;
  }

  const postsOrdered: Post[] = await postProcessor(posts);

  if (postsOrdered.length === 0) {
    console.warn('Showcases Forum was empty!');
    await interaction.reply({
      flags: MessageFlags.Ephemeral,
      content:
        'There was no valid posts in showcases forum. (N might be too low?)',
    });
    return;
  }
  const component = createContainer(postsOrdered);

  await digestChannel.send({
    flags: MessageFlags.IsComponentsV2,
    components: [component],
  });
  await interaction.reply({
    flags: MessageFlags.Ephemeral,
    content: 'Successfully digested the message!',
  });
};
