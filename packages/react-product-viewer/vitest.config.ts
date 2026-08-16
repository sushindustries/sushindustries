import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    name: '@sushindustries/react-product-viewer',
    include: ['tests/**/*.test.{ts,tsx}'],
    environment: 'jsdom',
  },
})
