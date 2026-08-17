import { defineConfig } from 'tsdown'

export default defineConfig({
  entry: [
    'src/index.tsx',
    'src/query.ts',
    'src/router.ts',
    'src/elements/model-mark/index.tsx',
  ],
  format: ['esm', 'cjs'],
  dts: true,
})
