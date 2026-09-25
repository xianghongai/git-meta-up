import path from 'node:path';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

// Dev server: `git-meta-up` points at the package source for hot reload.
// Build: it resolves through the package exports, so the deployed page runs the published `dist`.
export default defineConfig(({ command }) => ({
  base: '/git-meta-up/',
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, 'src'),
      ...(command === 'serve' ? { 'git-meta-up': path.resolve(import.meta.dirname, '../src/index.ts') } : {}),
    },
  },
  build: { outDir: 'dist', emptyOutDir: true },
}));
