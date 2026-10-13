import { SERVER_CHANNELS } from '@/constants/channels.js';
import { DAY } from '@/constants/time.js';
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
  MessageReaction,
} from 'discord.js';

type Post = { id: string; messageCount: number; likes: number };

const filterByReaction = (reactEmoji: MessageReaction) => {
  return reactEmoji.emoji.identifier == REACT_EMOJI;
};

const convertPosts = async (
  posts: Collection<string, ForumThreadChannel>
): Promise<Post[]> => {
  const settled = await Promise.all(
    posts.map(async (post) => {
      const firstMessage = await post.fetchStarterMessage().catch(() => null);
      if (!firstMessage) {
        console.error('Failed to get starter message under showcase-digest');
        return null;
      }
      const likes =
        firstMessage.reactions.cache.find(filterByReaction)?.count ?? 0;
      return {
        id: post.id,
        messageCount: post.messageCount ?? 0,
        likes,
      };
    })
  );

  return settled.filter((post): post is Post => post !== null);
};

const postProcessor = async (posts: Collection<string, ForumThreadChannel>) => {
  const postsUnordered: Post[] = await convertPosts(posts);
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

function filterPostsByCreationTime(
  posts: Collection<string, ForumThreadChannel>,
  lookbackN: number
): Collection<string, ForumThreadChannel> {
  const now = new Date().getTime();
  return posts.filter((post) => {
    const creationTime = post.createdAt?.getTime();
    if (!creationTime) {
      console.error('Creation time is missing from post on showcase-digest');
      return false;
    }
    return creationTime > now - DAY * lookbackN;
  });
}
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
