import { defineConfig } from 'vite';

export default defineConfig({
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
