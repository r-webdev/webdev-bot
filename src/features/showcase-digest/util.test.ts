import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { Collection } from 'discord.js';
import type { ForumThreadChannel, MessageReaction } from 'discord.js';
import { DAY } from '@/constants/time.js';
import { convertPosts, filterPostsByCreationTime } from './util.js';

// This magic identifier is the emoji code used to define what reaction it is.
// Code %F0%9F%98%AD refers to 'LOUDLY CRYING FACE' emoji
const REACT_IDENTIFIER = '%F0%9F%98%AD';

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
  posts.forEach((post) => collection.set(post.id, post));
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
            { identifier: REACT_IDENTIFIER, count: 3 },
            { identifier: '%F0%9F%91%8D', count: 99 },
          ],
        }),
      ]);

      const result = await convertPosts(posts, REACT_IDENTIFIER);

      assert.deepEqual(result, [{ id: 'a', messageCount: 5, likes: 3 }]);
    });

    void it('defaults likes to 0 when the react emoji is absent', async () => {
      const posts = collectionOf([
        mockPost({
          id: 'a',
          reactions: [{ identifier: '%F0%9F%91%8D', count: 9 }],
        }),
      ]);

      const [post] = await convertPosts(posts, REACT_IDENTIFIER);

      assert.equal(post.likes, 0);
    });

    void it('drops posts whose starter message is missing', async () => {
      const posts = collectionOf([
        mockPost({
          id: 'ok',
          reactions: [{ identifier: REACT_IDENTIFIER, count: 1 }],
        }),
        mockPost({ id: 'gone', noStarter: true }),
      ]);

      const result = await convertPosts(posts, REACT_IDENTIFIER);

      assert.deepEqual(
        result.map((post) => post.id),
        ['ok']
      );
    });

    void it('drops posts whose starter message fetch rejects', async () => {
      const posts = collectionOf([
        mockPost({
          id: 'ok',
          reactions: [{ identifier: REACT_IDENTIFIER, count: 1 }],
        }),
        mockPost({ id: 'boom', starterRejects: true }),
      ]);

      const result = await convertPosts(posts, REACT_IDENTIFIER);

      assert.deepEqual(
        result.map((post) => post.id),
        ['ok']
      );
    });

    void it('defaults a missing messageCount to 0', async () => {
      const posts = collectionOf([
        mockPost({ id: 'a', messageCount: undefined }),
      ]);

      const [post] = await convertPosts(posts, REACT_IDENTIFIER);

      assert.equal(post.messageCount, 0);
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
