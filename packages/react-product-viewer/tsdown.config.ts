import { defineConfig } from 'tsdown'

/**
 * Three entry points, because both TanStack peers are optional.
 *
 * Bundling them into one would put `@tanstack/react-query` and
 * `@tanstack/react-router` in the graph of every consumer, which is the opposite
 * of what `peerDependenciesMeta.optional` promises.
 */
export default defineConfig({
  entry: ['src/index.ts', 'src/query.ts', 'src/router.ts'],
  format: ['esm', 'cjs'],
  dts: true,
  sourcemap: true,
  clean: true,
  treeshake: true,
  // Copied verbatim rather than bundled. It is optional, so it must remain a
  // file a consumer can choose to import - or not.
  copy: [{ from: 'src/styles.css', to: 'dist' }],
})
