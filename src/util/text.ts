export const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g;

export const clampText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) {
    return text;
  }
  return `${text.slice(0, maxLength - 3)}...`;
};

export const wrapInDiffBlock = (text: string): string => {
  return `\`\`\`diff\n${text}\n\`\`\``;
};

export const stripCode = (content: string): string =>
  content.replace(/`[^`]*`/g, '');

export const stripEmoji = (content: string): string =>
  content.replace(/:\w+:/g, '');

export function replaceSpoilerHack(
  messageContent: string | null,
  replacement = '[...]'
) {
  return (messageContent ?? '').replace(/(\|\|\u200b\|\|)+/g, replacement);
}

// https://en.wikipedia.org/wiki/Jaccard_index
export function jaccardSimilarity(text1: string, text2: string): number {
  const words1 = new Set(normalizeText(text1));
  const words2 = new Set(normalizeText(text2));

  const intersection = words1.intersection(words2);
  const union = words1.union(words2);

  return union.size === 0 ? 0 : intersection.size / union.size;
}

export const normalizeText = (text: string) => {
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, '') // Remove punctuation & symbols
    .trim()
    .split(/\s+/)
    .filter(Boolean);
};
