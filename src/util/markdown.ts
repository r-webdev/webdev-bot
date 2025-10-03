import { type PathLike, readFileSync } from 'node:fs';
import { readdir, readFile } from 'node:fs/promises';
import z, { ZodType } from 'zod';

/**
 * A simple markdown parser that extracts frontmatter and content
 *
 * @param string - The markdown string to parse
 * @returns
 */
export const parseMarkdown = async <T extends Record<string, unknown>>(string: string) => {
  const frontmatterRegex = /^---\n([\s\S]+?)\n---/;
  const match = string.match(frontmatterRegex);
  let frontmatter: Partial<T> = {};
  let content = string;

  if (match) {
    const yaml = match[1];
    frontmatter = Object.fromEntries(
      yaml.split('\n').map((line) => {
        const [key, ...rest] = line.split(':');
        return [key.trim(), rest.join(':').trim()];
      })
    ) as Partial<T>;
    content = string.slice(match[0].length).trim();
  }

  return { frontmatter, content };
};

/** Load markdown files from a directory and parse them
 *
 * @param path - The path to the directory containing markdown files
 * @returns An array of parsed markdown files with frontmatter and content
 */
export const loadMarkdownOptions = async <T extends Record<string, unknown>>(path: PathLike) => {
  const files = await readdir(path);
  const markdownFiles = files.filter((file) => file.endsWith('.md'));

  const results: Array<{ frontmatter: Partial<T>; content: string }> = [];

  for (const file of markdownFiles) {
    const filePath = new URL(`${path}/${file}`, import.meta.url);

    const fileContent = await readFile(filePath, 'utf-8');
    const result = await parseMarkdown<T>(fileContent);
    results.push(result);
  }
  return results;
};
