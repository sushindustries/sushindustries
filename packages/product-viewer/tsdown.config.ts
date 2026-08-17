import { defineConfig } from 'tsdown'

export default defineConfig({
  entry: [
    'src/index.ts',
    'src/schema.ts',
    'src/swatch.ts',
    'src/zoned-material.ts',
  ],
  format: ['esm', 'cjs'],
  dts: true,
})
