import { diff } from 'node:util';

export const toDiscordDiff = (before: string, after: string): string => {
  const entries = diff(before.split('\n'), after.split('\n'));

  const lines = entries.map(([code, line]) => {
    const prefix = code === 1 ? '-' : code === -1 ? '+' : ' ';
    return `${prefix} ${line}`;
  });
  return lines.join('\n');
};
