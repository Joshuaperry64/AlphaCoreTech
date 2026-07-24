import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'jsdom',
<<<<<<< HEAD
    globals: true,
    coverage: {
      provider: 'v8'
    }
=======
>>>>>>> origin/pr/6/head
  },
})
