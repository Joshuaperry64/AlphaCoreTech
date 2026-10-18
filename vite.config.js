import { defineConfig } from 'vite';

export default defineConfig({
  envPrefix: ['VITE_', 'SUPABASE_', 'GEMINI_', 'STRIPE_', 'CIVITAI_', 'HF_', 'FB_', 'API_'],
  plugins: [],
  root: '.',
  publicDir: 'public',
  build: {
    target: 'esnext',
    outDir: 'dist',
    emptyOutDir: true,
  },
  server: {
    port: 3000,
    host: true
  }
});
