import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { Collection, ComponentType } from 'discord.js';
import type { ForumThreadChannel, Message, MessageReaction } from 'discord.js';
import { DAY } from '@/constants/time.js';
import { VOTE_EMOJIS } from './config.js';
import {
  convertPosts,
  filterPostsByCreationTime,
  isDigestMessage,
  isResultsMessage,
  isVoteEmoji,
  parseDigestPostIds,
  rankVoteResults,
  tallyDigestVotes,
} from './util.js';

// This magic identifier is the emoji code used to define what reaction it is.
// Code %F0%9F%98%AD refers to 'LOUDLY CRYING FACE' emoji
const REACT_IDENTIFIER_A = '%F0%9F%98%AD';
const REACT_IDENTIFIER_B = '%F0%9F%91%8D';

function reactionCache(
  entries: { identifier: string; count: number }[]
): Collection<string, MessageReaction> {
  const cache = new Collection<string, MessageReaction>();
  entries.forEach((entry, index) =>
    cache.set(entry.identifier + index, {
      emoji: { identifier: entry.identifier },
      count: entry.count,
    } as unknown as MessageReaction)
  );
  return cache;
}

type MockPostOptions = {
  id: string;
  messageCount?: number;
  createdAt?: Date | null;
  reactions?: { identifier: string; count: number }[];
  noStarter?: boolean;
  starterRejects?: boolean;
};

function mockPost(options: MockPostOptions): ForumThreadChannel {
  return {
    id: options.id,
    messageCount: options.messageCount ?? 0,
    createdAt: options.createdAt === undefined ? new Date() : options.createdAt,
    fetchStarterMessage: async () => {
      if (options.starterRejects) {
        throw new Error('fetch failed');
      }
      if (options.noStarter) {
        return null;
      }
      return { reactions: { cache: reactionCache(options.reactions ?? []) } };
    },
  } as unknown as ForumThreadChannel;
}

function collectionOf(
  posts: ForumThreadChannel[]
): Collection<string, ForumThreadChannel> {
  const collection = new Collection<string, ForumThreadChannel>();
  posts.forEach((post) => {
    return collection.set(post.id, post);
  });
  return collection;
}

void describe('showcase-digest/util', () => {
  void describe('convertPosts', () => {
    void it('maps a post to the count of the configured react emoji', async () => {
      const posts = collectionOf([
        mockPost({
          id: 'a',
          messageCount: 5,
          reactions: [
            { identifier: REACT_IDENTIFIER_A, count: 3 },
            { identifier: REACT_IDENTIFIER_B, count: 99 },
          ],
        }),
      ]);

      const result = await convertPosts(posts, REACT_IDENTIFIER_A);

      assert.deepEqual(result, [{ id: 'a', messageCount: 5, likes: 3 }]);
    });

    void it('defaults likes to 0 when the react emoji is absent', async () => {
      const posts = collectionOf([
        mockPost({
          id: 'a',
          reactions: [{ identifier: REACT_IDENTIFIER_B, count: 9 }],
        }),
      ]);

      const [post] = await convertPosts(posts, REACT_IDENTIFIER_A);

      assert.equal(post.likes, 0);
    });

    void it('drops posts whose starter message is missing', async () => {
      const posts = collectionOf([
        mockPost({
          id: 'ok',
          reactions: [{ identifier: REACT_IDENTIFIER_A, count: 1 }],
        }),
        mockPost({ id: 'gone', noStarter: true }),
      ]);

      const result = await convertPosts(posts, REACT_IDENTIFIER_A);

      assert.deepEqual(
        result.map((post) => post.id),
        ['ok']
      );
    });

    void it('drops posts whose starter message fetch rejects', async () => {
      const posts = collectionOf([
        mockPost({
          id: 'ok',
          reactions: [{ identifier: REACT_IDENTIFIER_A, count: 1 }],
        }),
        mockPost({ id: 'boom', starterRejects: true }),
      ]);

      const result = await convertPosts(posts, REACT_IDENTIFIER_A);

      assert.deepEqual(
        result.map((post) => post.id),
        ['ok']
      );
    });

    void it('defaults a missing messageCount to 0', async () => {
      const posts = collectionOf([
        mockPost({ id: 'a', messageCount: undefined }),
      ]);

      const [post] = await convertPosts(posts, REACT_IDENTIFIER_A);

      assert.equal(post.messageCount, 0);
    });
  });

  void describe('isVoteEmoji', () => {
    void it('recognises a configured voting emoji', () => {
      const reaction = {
        emoji: { name: VOTE_EMOJIS[0] },
      } as unknown as MessageReaction;

      assert.equal(isVoteEmoji(reaction), true);
    });

    void it('rejects an unrelated emoji', () => {
      const reaction = {
        emoji: { name: 'x' },
      } as unknown as MessageReaction;

      assert.equal(isVoteEmoji(reaction), false);
    });

    void it('rejects an emoji with no name', () => {
      const reaction = {
        emoji: { name: null },
      } as unknown as MessageReaction;

      assert.equal(isVoteEmoji(reaction), false);
    });
  });

  function digestMessage(lines: string[], title: string): Message {
    const textDisplays = [title, ...lines].map((content) => ({
      type: ComponentType.TextDisplay,
      content,
    }));
    return {
      components: [{ type: ComponentType.Container, components: textDisplays }],
    } as unknown as Message;
  }

  void describe('isDigestMessage / isResultsMessage', () => {
    void it('identifies a digest message by its title', () => {
      const message = digestMessage(['1. <#a>'], '## Showcase Digest');

      assert.equal(isDigestMessage(message), true);
      assert.equal(isResultsMessage(message), false);
    });

    void it('identifies a results message by its title', () => {
      const message = digestMessage(['1. <#a>'], '## Showcase Digest Results');

      assert.equal(isResultsMessage(message), true);
      assert.equal(isDigestMessage(message), false);
    });

    void it('ignores a message without a container', () => {
      const message = { components: [] } as unknown as Message;

      assert.equal(isDigestMessage(message), false);
    });
  });

  void describe('parseDigestPostIds', () => {
    void it('recovers post ids from channel mentions in display order', () => {
      const message = digestMessage(
        [
          `1. <#111> (Comments: 2) ${VOTE_EMOJIS[0]}`,
          `2. <#222> (Comments: 5) ${VOTE_EMOJIS[1]}`,
          '-# <@&999>',
        ],
        '## Showcase Digest'
      );

      assert.deepEqual(parseDigestPostIds(message), ['111', '222']);
    });
  });

  void describe('tallyDigestVotes', () => {
    function reactionsFor(
      entries: { emoji: string; count: number; me?: boolean }[]
    ): Collection<string, MessageReaction> {
      const cache = new Collection<string, MessageReaction>();
      entries.forEach((entry, index) =>
        cache.set(entry.emoji + index, {
          emoji: { name: entry.emoji },
          count: entry.count,
          me: entry.me ?? false,
        } as unknown as MessageReaction)
      );
      return cache;
    }

    void it('subtracts the bot seed reaction from each vote count', () => {
      const reactions = reactionsFor([
        { emoji: VOTE_EMOJIS[0], count: 4, me: true },
        { emoji: VOTE_EMOJIS[1], count: 1, me: true },
      ]);

      const results = tallyDigestVotes(['a', 'b'], reactions);

      assert.deepEqual(results, [
        { postId: 'a', rank: 1, votes: 3 },
        { postId: 'b', rank: 2, votes: 0 },
      ]);
    });

    void it('treats a missing reaction as zero votes', () => {
      const results = tallyDigestVotes(['a'], reactionsFor([]));

      assert.deepEqual(results, [{ postId: 'a', rank: 1, votes: 0 }]);
    });
  });

  void describe('rankVoteResults', () => {
    void it('orders by votes descending and breaks ties by rank', () => {
      const ranked = rankVoteResults([
        { postId: 'a', rank: 1, votes: 2 },
        { postId: 'b', rank: 2, votes: 5 },
        { postId: 'c', rank: 3, votes: 2 },
      ]);

      assert.deepEqual(
        ranked.map((result) => result.postId),
        ['b', 'a', 'c']
      );
    });
  });

  void describe('filterPostsByCreationTime', () => {
    const now = Date.now();

    void it('keeps posts created within the lookback window', () => {
      const posts = collectionOf([
        mockPost({ id: 'recent', createdAt: new Date(now - 1 * DAY) }),
      ]);

      const result = filterPostsByCreationTime(posts, 7);

      assert.deepEqual([...result.keys()], ['recent']);
    });

    void it('excludes posts older than the lookback window', () => {
      const posts = collectionOf([
        mockPost({ id: 'recent', createdAt: new Date(now - 1 * DAY) }),
        mockPost({ id: 'stale', createdAt: new Date(now - 10 * DAY) }),
      ]);

      const result = filterPostsByCreationTime(posts, 7);

      assert.deepEqual([...result.keys()], ['recent']);
    });

    void it('excludes posts with a missing creation time', () => {
      const posts = collectionOf([
        mockPost({ id: 'recent', createdAt: new Date(now - 1 * DAY) }),
        mockPost({ id: 'undated', createdAt: null }),
      ]);

      const result = filterPostsByCreationTime(posts, 7);

      assert.deepEqual([...result.keys()], ['recent']);
    });
  });
});
