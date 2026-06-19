/**
 * Dev-only: server-render the real UI to a self-contained HTML snapshot so the
 * default state can be eyeballed without a browser toolchain. Run with:
 *   npx vite-node scripts/snapshot.tsx
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { renderToStaticMarkup } from 'react-dom/server';
import { App } from '../src/ui/App';

const here = dirname(fileURLToPath(import.meta.url));
const css = readFileSync(resolve(here, '../src/ui/styles.css'), 'utf8');
const body = renderToStaticMarkup(<App />);

const html = `<!doctype html>
<html lang="ko"><head><meta charset="utf-8">
<title>Halfway — snapshot</title>
<style>${css}
html,body{height:100%}
.app{height:100vh}
</style></head>
<body><div id="root">${body}</div></body></html>`;

const out = resolve(here, '../preview.html');
writeFileSync(out, html);
console.log('wrote', out);
