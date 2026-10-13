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
  Message,
  MessageReaction,
} from 'discord.js';

type Post = { id: string; messageCount: number; likes: number };

const filterByReaction = (reactEmoji: MessageReaction) => {
  return reactEmoji.emoji.identifier == REACT_EMOJI;
};

const convertPosts = async (posts: Collection<string, ForumThreadChannel>) => {
  return await Promise.all(
    posts.map(async (post) => {
      const firstMessage: Message | null = await post.fetchStarterMessage();
      if (!firstMessage) {
        console.error('Failed to get starter message under showcase-digest');
        return { id: '', messageCount: 0, likes: 0 };
      }
      const likes = firstMessage.reactions.cache.find(filterByReaction)?.count;
      return {
        id: post.id,
        messageCount: post.messageCount ? post.messageCount : 0,
        likes: likes ? likes : 0,
      };
    })
  );
};

const postProcessor = async (posts: Collection<string, ForumThreadChannel>) => {
  const container = new ContainerBuilder();
  container.addTextDisplayComponents(
    new TextDisplayBuilder().setContent('## Showcase Digest')
  );

  const postsUnordered: Post[] = await convertPosts(posts);
  const sortByDescPost = (postA: Post, postB: Post) =>
    postB.likes - postA.likes;
  const postsOrdered = postsUnordered.sort(sortByDescPost);

  postsOrdered.forEach((post, index) => {
    container.addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        `${index}. ${channelMention(post.id)} (Comments: ${post.messageCount})`
      )
    );
  });
  return container.components.length > 1 ? container : null;
};

function filterPostsByCreationTime(
  posts: Collection<string, ForumThreadChannel>,
  lookbackN: number
): Collection<string, ForumThreadChannel> {
  return posts.filter((post) => {
    const creationTime = post.createdAt?.getTime();
    const now = new Date().getTime();
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

  const component = await postProcessor(posts);
  if (component === null) {
    console.warn('Showcases Forum was empty!');
    await interaction.reply({
      flags: MessageFlags.Ephemeral,
      content:
        'There was no valid posts in showcases forum. (N might be too low?)',
    });
    return;
  }

  await digestChannel.send({
    flags: MessageFlags.IsComponentsV2,
    components: [component],
  });
  await interaction.reply({
    flags: MessageFlags.Ephemeral,
    content: 'Successfully digested the message!',
  });
};
