import { DAY } from '@/constants/time.js';
import { Collection, ForumThreadChannel, MessageReaction } from 'discord.js';

export type Post = { id: string; messageCount: number; likes: number };

export const filterByReaction = (
  reaction: MessageReaction,
  reactEmoji: string
): boolean => {
  return reaction.emoji.identifier === reactEmoji;
};

export const convertPosts = async (
  posts: Collection<string, ForumThreadChannel>,
  reactEmoji: string
): Promise<Post[]> => {
  const settled = await Promise.allSettled(
    posts.map(async (post): Promise<Post> => {
      const firstMessage = await post.fetchStarterMessage();
      if (!firstMessage) {
        throw new ShowcaseDigestValidationError(
          'Something went wrong, please try again later.',
          'Failed to get starter message under showcase-digest',
          LEVEL.WARN
        );
      }
      const likes =
        firstMessage.reactions.cache.find((reaction) => {
          return filterByReaction(reaction, reactEmoji);
        })?.count ?? 0;
      return {
        id: post.id,
        messageCount: post.messageCount ?? 0,
        likes,
      };
    })
  );

  return settled.flatMap((result) => {
    if (result.status === 'rejected') {
      if (result.reason instanceof ShowcaseDigestValidationError) {
        result.reason.logError();
        return [];
      }
      throw result.reason;
    }
    return [result.value];
  });
};

export const filterPostsByCreationTime = (
  posts: Collection<string, ForumThreadChannel>,
  lookbackN: number
): Collection<string, ForumThreadChannel> => {
  const now = new Date().getTime();
  return posts.filter((post) => {
    const creationTime = post.createdAt?.getTime();
    if (!creationTime) {
      console.error('Creation time is missing from post on showcase-digest');
      return false;
    }
    return creationTime > now - DAY * lookbackN;
  });
};

export enum LEVEL {
  SEVERE,
  WARN,
  INFO,
}
export class ShowcaseDigestValidationError extends Error {
  userMessage: string;
  level?: LEVEL;
  constructor(userMessage: string, logError?: string, level?: LEVEL) {
    super(logError);
    this.userMessage = userMessage;
    this.name = 'ShowcaseDigestValidationError';
    this.level = level;
  }
  public logError() {
    const logMessage = this.message;
    if (logMessage === '') {
      return;
    }
    switch (this.level) {
      case LEVEL.WARN:
        console.warn(logMessage);
        break;
      case LEVEL.INFO:
        console.log(logMessage);
        break;
      default:
      case LEVEL.SEVERE:
        console.error(logMessage);
        break;
    }
  }
  public getUserMessage(): string {
    return this.userMessage;
  }
}
