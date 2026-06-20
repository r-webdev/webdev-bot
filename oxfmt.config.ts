import { defineConfig } from 'oxfmt';

export default defineConfig({
  printWidth: 80,
  useTabs: false,
  tabWidth: 2,
  semi: true,
  singleQuote: true,
  trailingComma: 'es5',
  bracketSpacing: true,
  arrowParens: 'always',
  ignorePatterns: ['node_modules', 'dist', 'build', 'coverage', '.git'],
});
