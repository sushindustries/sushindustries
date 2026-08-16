import { defineConfig } from 'tsdown'

/**
 * Three entry points, because two of the dependencies are optional.
 *
 * A single bundled entry would pull zod and three-custom-shader-material into
 * the graph of every consumer, which is the opposite of declaring them optional.
 */
export default defineConfig({
  entry: [
    'src/index.ts',
    'src/schema.ts',
    'src/swatch.ts',
    'src/zoned-material.ts',
  ],
  format: ['esm', 'cjs'],
  dts: true,
  sourcemap: true,
  clean: true,
  treeshake: true,
})
