import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    host: '0.0.0.0',
    port: 3002
  },
  build: {
    outDir: 'dist',
    sourcemap: true
  },
  preview: {
    host: '0.0.0.0',
    port: 3002
  }
});