import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Use relative asset paths in production so the build works no matter where it
// is served from — project subpath (/halfway/), domain root, or a custom domain
// (this repo's Pages uses one). Avoids hard-coding a base that can 404 assets.
export default defineConfig(({ command }) => ({
  base: command === 'build' ? './' : '/',
  plugins: [react()],
  test: {
    globals: true,
    environment: 'node',
    include: ['src/**/*.test.{ts,tsx}'],
  },
}));
