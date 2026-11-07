export const LOOKBACK_N: number = 14;
export const REACT_EMOJI = '%F0%9F%91%8D';

// Number of top-ranked posts that receive a voting emoji in the digest. Capped
// at 10 because voting uses the keycap number emojis (1 through 10).
export const MAX_VOTABLE_POSTS = 10;

// Days between posting a digest and announcing its voting results.
export const RESULTS_AFTER_DAYS = 3;

// The combining code points that turn a plain digit into a keycap emoji:
// VARIATION SELECTOR-16 followed by COMBINING ENCLOSING KEYCAP.
const KEYCAP_COMBINING = [0xfe0f, 0x20e3];

// Keycap number emojis 1..10 used as per-rank voting reactions. Built from code
// points so no literal emoji glyphs live in the source. Index 0 is "1", index 9
// is the single-code-point keycap ten emoji.
export const VOTE_EMOJIS: string[] = [
  ...Array.from({ length: 9 }, (_unused, index) =>
    String.fromCodePoint(0x31 + index, ...KEYCAP_COMBINING)
  ),
  String.fromCodePoint(0x1f51f),
];
