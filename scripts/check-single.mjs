import { readFileSync } from 'node:fs';
import { JSDOM, VirtualConsole } from 'jsdom';
const html = readFileSync(new URL('../dist-single/halfway.html', import.meta.url), 'utf8');
const errors = [];
const vc = new VirtualConsole();
vc.on('jsdomError', (e) => errors.push('jsdomError: ' + (e.detail?.message || e.message)));
const dom = new JSDOM(html, { runScripts: 'dangerously', pretendToBeVisual: true, virtualConsole: vc });
setTimeout(() => {
  const d = dom.window.document;
  console.log('root children:', d.getElementById('root')?.children.length ?? 'NO ROOT');
  console.log('.circle:', d.querySelectorAll('.circle').length);
  console.log('.meter:', d.querySelectorAll('.meter').length, '.preview:', d.querySelectorAll('.preview').length, '.candidate:', d.querySelectorAll('.candidate').length);
  console.log('caption:', JSON.stringify((d.querySelector('.caption')?.textContent||'').slice(0,30)));
  console.log('errors:', errors.length ? errors.slice(0,4) : 'NONE');
}, 400);
