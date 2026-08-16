import { defineConfig } from 'tsdown'

/**
 * Four entry points, and every one of them is a graph somebody should be able
 * to avoid.
 *
 * `query` and `router` are separate because both TanStack peers are optional -
 * bundling them in would put them in the graph of every consumer, which is the
 * opposite of what `peerDependenciesMeta.optional` promises.
 *
 * `model-mark` is separate for the same reason one level down. It lazily
 * imports the viewer from inside itself, so a page that names a mark ships no
 * three until one becomes live - and that only holds if the mark is reachable
 * without `index`, which statically imports the viewer. Bundlers report this
 * rather than silently undoing it: tsdown warns INEFFECTIVE_DYNAMIC_IMPORT when
 * a module is both statically and dynamically imported.
 */
export default defineConfig({
  entry: [
    'src/index.ts',
    'src/query.ts',
    'src/router.ts',
    'src/elements/model-mark/index.ts',
  ],
  format: ['esm', 'cjs'],
  dts: true,
  sourcemap: true,
  clean: true,
  treeshake: true,
  // Copied verbatim rather than bundled. It is optional, so it must remain a
  // file a consumer can choose to import - or not.
  copy: [{ from: 'src/styles.css', to: 'dist' }],
})
