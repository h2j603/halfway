/**
 * Post-process the single-file build so it runs from file:// (no web server).
 *
 * Browsers block ES-module scripts on the file:// origin, so the standalone is
 * built as a classic IIFE bundle; here we just drop the `type="module"` (and
 * crossorigin) attribute Vite still writes. Mount timing is handled in main.tsx
 * (it waits for DOMContentLoaded), so no HTML surgery is needed.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const file = resolve(here, '../dist-single/index.html');

let html = readFileSync(file, 'utf8');
html = html.replace(/<script\s+type="module"([^>]*)>/gi, '<script$1>').replace(/\s+crossorigin/gi, '');
writeFileSync(file, html);

console.log(/type="module"/i.test(html) ? 'WARNING: module attr still present' : 'single-file is file://-safe (classic script)');
