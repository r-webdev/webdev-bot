import { rules } from './rules-config.js';

export const MAX_RULE_TIMEFRAME = Math.max(
  ...rules
    .filter((rule) => rule.type !== 'contentBased')
    .map((rule) => rule.timeframe)
);

export const MESSAGE_SIMILARITY_THRESHOLD = 0.8;
