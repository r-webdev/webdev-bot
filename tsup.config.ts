import { defineConfig } from 'tsup';

export default defineConfig({
  bundle: false,
  clean: true,
  dts: false,
  outDir: 'dist',
  format: ['esm'],
  target: 'esnext',
  entry: ['src/**/*.ts', 'src/*.ts'],
  minify: true,
});
