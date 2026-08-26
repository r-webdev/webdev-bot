export const stripCodeBlocks = (text: string): string =>
  text.replace(/```[\s\S]*?```/g, '').trim();

export const stripInlineCode = (text: string): string =>
  text.replace(/`[^`]*`/g, '').trim();

export const stripAllCode = (text: string): string =>
  stripInlineCode(stripCodeBlocks(text)).trim();
