import { defineConfig } from 'tsup';

export default defineConfig({
  bundle: true,
  clean: true,
  dts: false,
  outDir: 'dist',
  format: ['esm'],
  target: 'esnext',
  entry: ['src/index.ts'],
  minify: false,
  external: [
    // Don't bundle discord.js - it has dynamic requires that don't work in ESM bundles
    'discord.js',
    '@discordjs/core',
    // Don't bundle typescript - it has dynamic requires that don't work in ESM bundles
    'typescript',
  ],
  treeshake: true,
  shims: true,
});
