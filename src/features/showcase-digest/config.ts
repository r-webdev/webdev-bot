export const LOOKBACK_N: number = 14;
export const REACT_EMOJI = '%F0%9F%91%8D';

export const MAX_VOTABLE_POSTS = 10;

export const RESULTS_AFTER_DAYS = 3;

// VARIATION SELECTOR-16 followed by COMBINING ENCLOSING KEYCAP, which turn a
// plain digit into a keycap emoji.
const KEYCAP_COMBINING = [0xfe0f, 0x20e3];

export const VOTE_EMOJIS: string[] = [
  ...Array.from({ length: 9 }, (_unused, index) =>
    String.fromCodePoint(0x31 + index, ...KEYCAP_COMBINING)
  ),
  String.fromCodePoint(0x1f51f),
];

// First, second and third place medals used to rank the top posts.
export const TOP_MEDAL_EMOJIS: string[] = [
  String.fromCodePoint(0x1f947),
  String.fromCodePoint(0x1f948),
  String.fromCodePoint(0x1f949),
];

// Sports medal (gold with a star), used for honorable mentions.
export const HONORABLE_MENTION_EMOJI = String.fromCodePoint(0x1f3c5);
