import { DAY } from '@/constants/time.js';
import {
  Collection,
  ComponentType,
  ForumThreadChannel,
  Message,
  MessageReaction,
} from 'discord.js';
import { MAX_VOTABLE_POSTS, VOTE_EMOJIS } from './config.js';

export type Post = { id: string; messageCount: number; likes: number };

export type VoteResult = { postId: string; rank: number; votes: number };

const DIGEST_TITLE = '## Showcase Digest';
const RESULTS_TITLE = '## Showcase Digest Results';

const CHANNEL_MENTION_REGEX = /<#(\d+)>/g;

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
          'Failed to get starter message under showcase-digest'
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
        console.error(result.reason.message);
      } else {
        console.error(
          'Unexpected error in scheduled showcase digest:',
          result.reason
        );
      }
      return [];
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

const firstTextDisplayContent = (message: Message): string | undefined => {
  const container = message.components[0];
  if (!container || container.type !== ComponentType.Container) {
    return undefined;
  }
  const firstComponent = container.components[0];
  if (!firstComponent || firstComponent.type !== ComponentType.TextDisplay) {
    return undefined;
  }
  return firstComponent.content;
};

export const isResultsMessage = (message: Message): boolean => {
  return firstTextDisplayContent(message)?.startsWith(RESULTS_TITLE) === true;
};

export const isDigestMessage = (message: Message): boolean => {
  const content = firstTextDisplayContent(message);
  return (
    content?.startsWith(DIGEST_TITLE) === true &&
    !content.startsWith(RESULTS_TITLE)
  );
};

// Recovers the ranked post ids from a posted digest by reading the channel
// mentions out of its ComponentsV2 text, in display order. This lets the
// results cron work without persisting any per-digest state.
export const parseDigestPostIds = (message: Message): string[] => {
  const container = message.components[0];
  if (!container || container.type !== ComponentType.Container) {
    return [];
  }

  const postIds: string[] = [];
  for (const component of container.components) {
    if (component.type !== ComponentType.TextDisplay) {
      continue;
    }
    for (const match of component.content.matchAll(CHANNEL_MENTION_REGEX)) {
      postIds.push(match[1]);
    }
  }
  return postIds;
};

export const tallyDigestVotes = (
  postIds: string[],
  reactions: Collection<string, MessageReaction>
): VoteResult[] => {
  return postIds.slice(0, MAX_VOTABLE_POSTS).map((postId, index) => {
    const emoji = VOTE_EMOJIS[index];
    const reaction = reactions.find((entry) => entry.emoji.name === emoji);
    // The bot seeds every voting emoji, so its own reaction is not a vote.
    const botVote = reaction?.me ? 1 : 0;
    const votes = Math.max((reaction?.count ?? 0) - botVote, 0);
    return { postId, rank: index + 1, votes };
  });
};

export const rankVoteResults = (results: VoteResult[]): VoteResult[] => {
  return [...results].sort((resultA, resultB) => {
    if (resultB.votes !== resultA.votes) {
      return resultB.votes - resultA.votes;
    }
    return resultA.rank - resultB.rank;
  });
};

export class ShowcaseDigestValidationError extends Error {
  externalMessage: string;
  constructor(internalMessage: string, externalMessage: string) {
    super(internalMessage);
    this.externalMessage = externalMessage;
    this.name = 'ShowcaseDigestValidationError';
  }
  public getExternalMessage(): string {
    return this.externalMessage;
  }
}
