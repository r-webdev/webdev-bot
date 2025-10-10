export const levenshtein = (a: string, b: string) => {
  const dp = Array.from({ length: a.length + 1 }, () => Array(b.length + 1).fill(0));

  for (let i = 0; i <= a.length; i++) {
    dp[i][0] = i;
  }
  for (let j = 0; j <= b.length; j++) {
    dp[0][j] = j;
  }

  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1, // deletion
        dp[i][j - 1] + 1, // insertion
        dp[i - 1][j - 1] + cost // substitution
      );
    }
  }

  return dp[a.length][b.length];
};

const bestSubstringDistance = (query: string, text: string): number => {
  const queryLen = query.length;
  const textLen = text.length;
  let minDistance = Infinity;

  // The range of substring lengths to check (e.g., query length +/- 3 characters)
  const range = 3;

  // Iterate over all possible starting points in the text
  for (let i = 0; i < textLen; i++) {
    // Iterate over possible ending points, limiting the substring length
    for (
      let j = Math.max(i + queryLen - range, i + 1);
      j <= Math.min(i + queryLen + range, textLen);
      j++
    ) {
      const sub = text.substring(i, j);
      const distance = levenshtein(query, sub);
      minDistance = Math.min(minDistance, distance);
    }
  }

  return minDistance;
};

export function fuzzySearch<T>({
  query,
  items,
  findIn,
  limit = 10,
}: {
  query?: string;
  items: T[];
  findIn: Array<(item: T) => string>;
  limit?: number;
}) {
  if (!query || query.trim() === '') {
    return items.slice(0, limit);
  }

  const threshold = 0.3; // minimum score to consider a match
  const EXACT_MATCH_BOOST = 100; // Large boost for perfect match
  const PREFIX_BOOST = 10; // Smaller boost for prefix match

  query = query.trim().toLowerCase();
  const queryLen = query.length;

  const scored = items.map((item) => {
    let maxFuzzyScore = 0;
    let titleMatchScore = 0;

    // 1. Calculate Fuzzy Score (Max Levenshtein Score from all keys)
    const scores = findIn.map((fn) => {
      const text = fn(item).toLowerCase();

      // Apply a large, non-normalized boost for exact or prefix matches
      if (text === query) {
        titleMatchScore = EXACT_MATCH_BOOST; // Query "array" matches title "Array"
      } else if (titleMatchScore < EXACT_MATCH_BOOST && text.startsWith(query)) {
        // If not a perfect match, check for prefix match
        titleMatchScore = Math.max(titleMatchScore, PREFIX_BOOST);
      } else if (titleMatchScore === 0 && text.includes(` ${query} `)) {
        // A minor boost if it's a whole word in the middle (optional)
        titleMatchScore = Math.max(titleMatchScore, 1);
      }

      // Fuzzy match using normalized Levenshtein distance
      const distance = bestSubstringDistance(query, text);
      const fuzzyScore = 1 - distance / queryLen; // normalized to 0–1
      return fuzzyScore;
    });

    maxFuzzyScore = Math.max(...scores);

    // Combine Scores
    // The final score is the max fuzzy score plus the title match boost.
    // The high boost (100) ensures it ranks above any normalized fuzzy score (max 1.0).
    const finalScore = maxFuzzyScore + titleMatchScore;

    return { item, score: finalScore };
  });

  return (
    scored
      // Filter by the original fuzzy score threshold (optional, you could use a lower threshold)
      .filter((s) => s.score >= threshold)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map((s) => s.item)
  );
}
