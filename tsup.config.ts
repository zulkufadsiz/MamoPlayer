import { defineConfig } from 'tsup';

export default defineConfig({
  entry: {
    core: 'core.tsx',
  },
  format: ['esm'],
  dts: true,
  sourcemap: true,
  splitting: false,
  clean: true,
  treeshake: true,
  target: 'es2019',
  outExtension({ format }) {
    return {
      js: format === 'cjs' ? '.cjs' : '.js',
    };
  },
});
