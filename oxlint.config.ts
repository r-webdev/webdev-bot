import { defineConfig } from 'oxlint';

export default defineConfig({
  options: {
    typeAware: true,
    typeCheck: true,
  },
  plugins: ['eslint', 'typescript'],
  rules: {
    curly: 'warn',
    'prefer-template': 'warn',
    'typescript/no-explicit-any': 'error',
    'prefer-const': 'error',
  },
  ignorePatterns: ['node_modules', 'dist', 'build', 'coverage', '.git'],
});
