import { defineConfig } from 'tsdown'

export default defineConfig({
  entry: [
    'src/client.server.ts',
    'src/schema.ts',
  ],
  format: ['esm', 'cjs'],
  dts: true,
})
