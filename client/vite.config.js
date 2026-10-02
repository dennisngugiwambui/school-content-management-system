import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const API = process.env.VITE_DEV_API || 'http://localhost:5050';

export default defineConfig({
  // GitHub Pages serves the site from /<repo-name>/; scripts/build-pages.mjs sets this.
  base: process.env.VITE_BASE || '/',
  plugins: [react()],
  server: {
    port: 5173,
    proxy: { '/api': API, '/uploads': API },
  },
  css: {
    preprocessorOptions: {
      scss: {
        quietDeps: true,
        silenceDeprecations: ['import', 'global-builtin', 'color-functions', 'mixed-decls'],
      },
    },
  },
  build: {
    outDir: process.env.VITE_OUT_DIR || 'dist',
    chunkSizeWarningLimit: 900,
  },
});
