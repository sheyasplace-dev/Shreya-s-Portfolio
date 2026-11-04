// Sanity checks for a project with no build step, so nothing else would catch these:
//   1. every JavaScript file parses (node --check);
//   2. every file the site points to exists: assets in HTML, CSS and JS, stylesheets, ES module imports,
//      and the icons named in the web manifest;
//   3. (informational) assets that nothing points to.
// Usage: npm run check      Exits 1 if a file is missing or a script doesn't parse.
import { readFileSync, readdirSync, existsSync, statSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
const rel = (file) => relative(root, file);

// Assets the code builds the name of at runtime, so a text search can't see them.
// flock.js: `assets/birds/bird-${name}-${layer}.webp`
const BUILT_AT_RUNTIME = [/^assets\/birds\/bird-/];

function walk(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    if (entry.name.startsWith('.') || entry.name === 'node_modules') return [];
    const full = join(dir, entry.name);
    return entry.isDirectory() ? walk(full) : [full];
  });
}

const files = walk(root);
const scripts = files.filter((f) => f.endsWith('.js') || f.endsWith('.mjs'));
const sources = files.filter((f) => /\.(html|css|js|mjs)$/.test(f));
const problems = [];

// 1. Syntax
for (const file of scripts) {
  const result = spawnSync(process.execPath, ['--check', file], { encoding: 'utf8' });
  if (result.status !== 0) problems.push(`syntax error in ${rel(file)}\n${result.stderr.trim()}`);
}

// 2. References
const referenced = new Set();
const mentions = /(?:assets|styles|scripts)\/[\w\-./]+\.(?:webp|jpe?g|png|svg|mp4|m4a|mp3|css|m?js)/g;

// Comments often hold example paths ("e.g. assets/audio/theme.mp3"), which aren't references.
// `//` only counts as a comment at the start of a line or after whitespace, so "https://" survives.
const withoutComments = (text) => text
  .replace(/<!--[\s\S]*?-->/g, '')
  .replace(/\/\*[\s\S]*?\*\//g, '')
  .replace(/(^|\s)\/\/.*$/gm, '$1');

function expect(target, from) {
  const clean = target.split(/[?#]/)[0];
  referenced.add(clean);
  if (!existsSync(join(root, clean))) problems.push(`${rel(from)} points to ${clean}, which doesn't exist`);
}

for (const file of sources) {
  const text = withoutComments(readFileSync(file, 'utf8'));
  for (const [mention] of text.matchAll(mentions)) expect(mention, file);

  // Relative ES module imports: from './x.js', from '../lib/y.js'
  if (file.endsWith('.js') || file.endsWith('.mjs')) {
    for (const [, spec] of text.matchAll(/from\s+['"](\.{1,2}\/[^'"]+)['"]/g)) {
      expect(relative(root, resolve(dirname(file), spec)), file);
    }
  }
}

// Root-level files named in <head> and the manifest.
const html = readFileSync(join(root, 'index.html'), 'utf8');
for (const [, href] of html.matchAll(/<link[^>]+href="([^"#:]+)"/g)) {
  if (!/^https?:/.test(href)) expect(href, join(root, 'index.html'));
}
const manifest = JSON.parse(readFileSync(join(root, 'site.webmanifest'), 'utf8'));
for (const icon of manifest.icons ?? []) expect(icon.src, join(root, 'site.webmanifest'));

// 3. Unreferenced assets
const unused = files
  .map(rel)
  .filter((f) => f.startsWith('assets/') && !f.endsWith('.gitkeep'))
  .filter((f) => !referenced.has(f) && !BUILT_AT_RUNTIME.some((re) => re.test(f)));

console.log(`${scripts.length} scripts parsed, ${referenced.size} referenced files checked.`);
if (unused.length) console.log(`\nNot referenced anywhere (safe to delete if you don't plan to use them):\n  ${unused.join('\n  ')}`);
if (problems.length) {
  console.error(`\n${problems.length} problem(s):\n- ${problems.join('\n- ')}`);
  process.exit(1);
}
console.log('OK');
