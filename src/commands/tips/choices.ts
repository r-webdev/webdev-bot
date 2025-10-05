const justAsk = [
  'Just Ask',
  `
    **Don't ask to ask, just ask!**
    Here's why: https://sol.gfxile.net/dontask.html
  `,
] as const;

const otherLanguageExamples = ['php', 'css', 'html', 'ts', 'sql', 'md']
  .map((str) => `\`${str}\``)
  .join(', ');
const format = [
  'Format',
  `
    Did you know you can add syntax highlighting to your code in Discord?
    https://cdn.discordapp.com/attachments/550768098660188191/834795086126121010/2021-04-22_10-16-33.gif
    > \`\`\`js
    > // Your code here
    > \`\`\`
    You can replace \`js\` with other languages too, e.g. ${otherLanguageExamples} and so on...
    To properly _format_ your code, try pasting it in here first: https://prettier.io/playground/
  `,
] as const;

const code = [
  'Code',
  'Include relevant code snippets to illustrate your problem. This helps others understand your issue better.',
] as const;

const englishOnly = [
  'English Only',
  'Please communicate in English to ensure everyone can understand and contribute to the discussion.',
] as const;

export const pleaseChoices = new Map<string, string>([justAsk, format, code, englishOnly]);
