import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { viteSingleFile } from 'vite-plugin-singlefile';

// Builds the whole app into ONE self-contained file that also runs when opened
// directly from the filesystem (file://). Browsers block ES-module scripts over
// file://, so we emit a classic IIFE bundle (no `type="module"`); a tiny post
// step in `build:single` strips the module attribute Vite still writes.
// Output: dist-single/index.html
export default defineConfig({
  base: './',
  plugins: [react(), viteSingleFile()],
  build: {
    outDir: 'dist-single',
    cssCodeSplit: false,
    assetsInlineLimit: 100000000,
    target: 'es2018',
    modulePreload: false,
    rollupOptions: {
      output: {
        format: 'iife',
        inlineDynamicImports: true,
      },
    },
  },
});
