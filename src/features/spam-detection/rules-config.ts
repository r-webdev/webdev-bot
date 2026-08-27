import type { Channel, Message } from 'discord.js';
import { MINUTE, SECOND } from '../../constants/time.js';
import {
  handleBannedTagsAction,
  handleCrossPostingAction,
  handleDiscordInvitesAction,
  handleHighFrequencyAction,
  handleSpoilerHackAction,
} from './actions.js';
import {
  anyMessage,
  containsBannedTag,
  containsDiscordInvite,
  containsSpoilerHack,
  isCrossPost,
} from './detectors.js';

export type ContentBasedRule = {
  isBrokenBy: (newMessage: Message) => boolean;
  action: (
    messages: Message[],
    rule: Rule,
    logChannel?: Channel
  ) => Promise<void>;
  type: 'contentBased';
};

export type CrossChannelRule = {
  isBrokenBy: (newMessage: Message, oldMessage: Message) => boolean;
  timeframe: number;
  channelCount: number;
  action: (
    messages: Message[],
    rule: Rule,
    logChannel?: Channel
  ) => Promise<void>;
  type: 'crossChannel';
};

export type FrequencyBasedRule = {
  timeframe: number;
  frequency: number;
  isBrokenBy: (newMessage: Message, oldMessage: Message) => boolean;
  action: (
    messages: Message[],
    rule: Rule,
    logChannel?: Channel
  ) => Promise<void>;
  type: 'frequencyBased';
};

export type Rule = ContentBasedRule | CrossChannelRule | FrequencyBasedRule;

export const rules: Rule[] = [
  {
    type: 'contentBased',
    isBrokenBy: containsBannedTag,
    action: handleBannedTagsAction,
  },
  {
    type: 'contentBased',
    isBrokenBy: containsDiscordInvite,
    action: handleDiscordInvitesAction,
  },
  {
    type: 'contentBased',
    isBrokenBy: containsSpoilerHack,
    action: handleSpoilerHackAction,
  },
  {
    type: 'crossChannel',
    isBrokenBy: isCrossPost,
    timeframe: 15 * SECOND,
    channelCount: 3,
    action: handleCrossPostingAction,
  },
  {
    type: 'crossChannel',
    isBrokenBy: isCrossPost,
    timeframe: 25 * SECOND,
    channelCount: 4,
    action: handleCrossPostingAction,
  },
  {
    type: 'crossChannel',
    isBrokenBy: isCrossPost,
    timeframe: 40 * SECOND,
    channelCount: 5,
    action: handleCrossPostingAction,
  },
  {
    type: 'crossChannel',
    isBrokenBy: isCrossPost,
    timeframe: 1 * MINUTE,
    channelCount: 6,
    action: handleCrossPostingAction,
  },
  {
    type: 'crossChannel',
    isBrokenBy: isCrossPost,
    timeframe: 2 * MINUTE,
    channelCount: 7,
    action: handleCrossPostingAction,
  },
  {
    type: 'frequencyBased',
    isBrokenBy: anyMessage,
    timeframe: 3 * SECOND,
    frequency: 15,
    action: handleHighFrequencyAction,
  },
  {
    type: 'frequencyBased',
    isBrokenBy: anyMessage,
    timeframe: 6 * SECOND,
    frequency: 20,
    action: handleHighFrequencyAction,
  },
];
