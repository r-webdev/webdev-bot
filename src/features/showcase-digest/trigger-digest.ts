import { createSlashCommand } from '@/common/commands/create-commands.js';
import { SERVER_CHANNELS } from '@/constants/channels.js';
import { MINUTE } from '@/constants/time.js';
import { config } from '@/env.js';

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

const LOOKBACK_N: number = (() => {
  const DEFAULT_N = 7;
  if (config.showcaseDigestLookbackDays) {
    try {
      return Number.parseInt(config.showcaseDigestLookbackDays);
    } catch (err) {
      console.error('Failed to parse showcaseDigestLookbackDays: ', err);
    }
  }
  console.warn(`DEFAULT_N is being used for showcase digest: n=${DEFAULT_N}`);
  return DEFAULT_N;
})();

const REACT_EMOJI = (() => {
  const DEFAULT_EMOJI: string = '%F0%9F%98%AD';
  if (config.showcaseReactEmoji) {
    return config.showcaseReactEmoji;
  }
  console.warn(
    `DEFAULT_REACT_EMOJI is being used for showcase digest: n=${DEFAULT_EMOJI}`
  );
  return DEFAULT_EMOJI;
})();

const postProcessor = async (posts: Collection<string, ForumThreadChannel>) => {
  const container = new ContainerBuilder();
  container.addTextDisplayComponents(
    new TextDisplayBuilder().setContent('## Showcase Digest')
  );
  type Post = { id: string; messageCount: number; likes: number };
  const filterByReaction = (reactEmoji: MessageReaction) => {
    return reactEmoji.emoji.identifier == REACT_EMOJI;
  };

  const sortByDescPost = (postA: Post, postB: Post) => {
    return postB.likes - postA.likes;
  };
  const postsUnordered: Post[] = await Promise.all(
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

  const postsOrdered = postsUnordered.sort(sortByDescPost);

  postsOrdered.forEach((post, index) => {
    container.addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        `${index}. ${channelMention(post.id)} (Comments: ${post.messageCount})`
      )
    );
  });
  return container.components.length ? container : null;
};

const digestHandler = async (
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
  const posts = forumChannel.threads.cache.filter((post) => {
    const creationTime = post.createdAt?.getTime();
    const now = new Date().getTime();
    if (!creationTime) {
      console.error('Creation time is missing from post on showcase-digest');
      return false;
    }
    return creationTime > now - MINUTE * LOOKBACK_N;
  });

  if (posts) {
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
    await interaction.reply('This worked!');
  } else {
    console.error('No posts found.');
    await interaction.reply('No posts were found.');
  }
};

export const createDigestCommand = createSlashCommand({
  data: {
    name: 'digest-force',
    description: `Forcefully consumes posts of the last ${LOOKBACK_N} days`,
  },
  execute: digestHandler,
});
