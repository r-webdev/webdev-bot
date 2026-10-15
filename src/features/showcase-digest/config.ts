import { config } from '@/env.js';

export const LOOKBACK_N: number = (() => {
  const DEFAULT_N = 7;
  if (config.showcaseDigestLookbackDays) {
    try {
      return Number.parseInt(config.showcaseDigestLookbackDays);
    } catch (err) {
      console.error('Failed to parse showcaseDigestLookbackDays: ', err);
    }
  }
  console.warn(`DEFAULT_N is being used for showcase digest: N=${DEFAULT_N}`);
  return DEFAULT_N;
})();

export const REACT_EMOJI = (() => {
  const DEFAULT_EMOJI: string = '%F0%9F%91%8D';
  if (config.showcaseReactEmoji) {
    return config.showcaseReactEmoji;
  }
  console.warn(
    `DEFAULT_REACT_EMOJI is being used for showcase digest: REACT_EMOJI=${DEFAULT_EMOJI}`
  );
  return DEFAULT_EMOJI;
})();
