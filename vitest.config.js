import { defineConfig } from 'vitest/config'

export default defineConfig({
  envPrefix: ['VITE_', 'SUPABASE_', 'GEMINI_', 'STRIPE_', 'CIVITAI_', 'HF_', 'FB_', 'API_'],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/tests/test-setup.js'],
    testTimeout: 20000,
    coverage: {
      provider: 'v8'
    }
  },
})
