import { defineConfig } from 'tsdown'

export default defineConfig({
  entry: [
    'src/index.ts',
    'src/archive/index.tsx',
    'src/card/index.tsx',
    'src/doc-aside/index.tsx',
    'src/icon/index.tsx',
    'src/markdown-view/index.tsx',
    'src/reveal/index.tsx',
    'src/scroll-spin/index.tsx',
    'src/section/index.tsx',
    'src/showcase/index.tsx',
    'src/smooth-scroll/index.ts',
  ],
  format: ['esm', 'cjs'],
  dts: true,
})
