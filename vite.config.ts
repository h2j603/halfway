import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// GitHub Pages serves the site under /<repo>/, so production assets need that
// base path. The dev server stays at root.
export default defineConfig(({ command }) => ({
  base: command === 'build' ? '/halfway/' : '/',
  plugins: [react()],
  test: {
    globals: true,
    environment: 'node',
    include: ['src/**/*.test.{ts,tsx}'],
  },
}));
