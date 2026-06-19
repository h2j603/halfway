/**
 * Post-process the single-file build so it runs from file:// (no web server).
 * Vite always writes `type="module"` on the entry script; with an IIFE bundle
 * that attribute is unnecessary and, over file://, prevents execution. Strip it
 * and drop any leftover crossorigin attribute.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const file = resolve(here, '../dist-single/index.html');

let html = readFileSync(file, 'utf8');
html = html.replace(/<script\s+type="module"([^>]*)>/i, '<script$1>').replace(/\s+crossorigin/gi, '');
writeFileSync(file, html);

const ok = !/type="module"/i.test(html);
console.log(ok ? 'single-file is file://-safe (classic script)' : 'WARNING: module attr still present');
