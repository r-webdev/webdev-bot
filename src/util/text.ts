export const clampText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) {
    return text;
  }
  return `${text.slice(0, maxLength - 3)}...`;
};

export const wrapInDiffBlock = (text: string): string => {
  return `\`\`\`diff\n${text}\n\`\`\``;
};
