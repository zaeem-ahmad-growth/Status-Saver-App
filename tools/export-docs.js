// Regenerates the Markdown docs that let anyone (or any Claude session) read this site without running it:
//   docs/tabs/<tab>.md       the full visible content of each tab, as it renders by default
//   docs/code-map.md         for every section: its id, where its markup and code live, and which data it reads
//   docs/data-dictionary.md  every field in assets/data.js, with types, sizes and examples
//   docs/research-index.md   every file in research/: what it is, the structure of each data file, short notes in full
//   docs/backend/<tab>.md    the full code that draws each tab and the full data it reads
//   docs/backend/research.md every research script and small data file, in full
// GitHub runs this after every push (.github/workflows/docs.yml) and commits the result, so nobody needs to run it by hand.
// To run it locally anyway:   node tools/export-docs.js
// Needs Node 18+ and Microsoft Edge or Google Chrome (set BROWSER=<path> if it is not found).
const fs = require('fs');
const path = require('path');
const os = require('os');
const vm = require('vm');
const { execFileSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const rel = p => path.relative(ROOT, p).split(path.sep).join('/');
const read = p => fs.readFileSync(path.join(ROOT, p), 'utf8').replace(/\r\n/g, '\n');
const write = (p, s) => { fs.mkdirSync(path.dirname(path.join(ROOT, p)), { recursive: true }); fs.writeFileSync(path.join(ROOT, p), s); };

// ---------- site facts ----------
const nav = read('assets/nav.js');
const TABS = [...nav.matchAll(/\{ slug: '([^']+)', label: '([^']+)' \}/g)].map(m => ({ slug: m[1], label: m[2] }));
const origin = git(['remote', 'get-url', 'origin']).trim();
const repoName = (origin.match(/github\.com[/:]([^/]+)\/([^/.]+)/) || []).slice(1);
const SITE = repoName.length ? `https://${repoName[0].toLowerCase()}.github.io/${repoName[1]}/` : '';
const hasApp = fs.existsSync(path.join(ROOT, 'assets/app.js'));
const APP = hasApp ? read('assets/app.js') : '';
function git(args) { try { return execFileSync('git', args, { cwd: ROOT, encoding: 'utf8' }); } catch (e) { return ''; } }

// ---------- browser ----------
function findBrowser() {
  if (process.env.BROWSER && fs.existsSync(process.env.BROWSER)) return process.env.BROWSER;
  const c = [
    'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', 'C:/Program Files/Microsoft/Edge/Application/msedge.exe',
    'C:/Program Files/Google/Chrome/Application/chrome.exe', path.join(process.env.LOCALAPPDATA || '', 'Google/Chrome/Application/chrome.exe'),
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge',
    '/usr/bin/google-chrome', '/usr/bin/chromium', '/usr/bin/chromium-browser', '/usr/bin/microsoft-edge',
  ];
  const hit = c.find(p => p && fs.existsSync(p));
  if (!hit) { console.error('No Edge or Chrome found. Set BROWSER to its path.'); process.exit(1); }
  return hit;
}
const BROWSER = findBrowser();
const PROFILE = path.join(os.tmpdir(), 'export-docs-profile');
function renderMarkdown(pageFile) {
  const html = fs.readFileSync(pageFile, 'utf8');
  const probe = path.join(path.dirname(pageFile), '__md.html');
  const toolUrl = path.relative(path.dirname(pageFile), path.join(ROOT, 'tools/dom-to-md.js')).split(path.sep).join('/');
  fs.writeFileSync(probe, html.replace(/<\/body>/i, `<script src="${toolUrl}"></script>\n</body>`));
  try {
    const dom = execFileSync(BROWSER, [...(process.env.CI ? ['--no-sandbox'] : []), '--headless=new', '--disable-gpu', '--no-first-run', '--no-default-browser-check', `--user-data-dir=${PROFILE}`,
      '--virtual-time-budget=10000', '--dump-dom', 'file:///' + probe.split(path.sep).join('/')], { encoding: 'utf8', maxBuffer: 256 * 1024 * 1024, stdio: ['ignore', 'pipe', 'ignore'] });
    const m = dom.match(/<pre id="__md"[^>]*>([\s\S]*?)<\/pre>/);
    if (!m) throw new Error('no Markdown produced for ' + rel(pageFile));
    return m[1].replace(/\r\n?/g, '\n').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&amp;/g, '&');
  } finally { fs.rmSync(probe, { force: true }); }
}
// Links and images are relative to the tab page; make them relative to docs/tabs/.
function relink(md, slug) {
  return md.replace(/(!?\[[^\]]*\]\()([^)\s]+)\)/g, (all, pre, url) => {
    if (/^([a-z]+:|#|\/)/i.test(url)) return all;
    const target = path.posix.normalize(path.posix.join('tabs', slug, url));
    return pre + path.posix.relative('docs/tabs', target) + ')';
  });
}

// ---------- 1. tab snapshots ----------
const pages = TABS.map(t => ({ ...t, file: path.join(ROOT, 'tabs', t.slug, 'index.html') })).filter(t => fs.existsSync(t.file));
for (const t of pages) {
  const html = fs.readFileSync(t.file, 'utf8');
  const usesApp = /assets\/app\.js/.test(html);
  const md = relink(renderMarkdown(t.file), t.slug);
  write(`docs/tabs/${t.slug}.md`, `# ${t.label}

> **Generated file: do not edit by hand.** Full visible text of the tab as it renders by default, produced by \`node tools/export-docs.js\`, which GitHub runs after every push.
> Live page: ${SITE ? SITE + 'tabs/' + t.slug + '/' : 'tabs/' + t.slug + '/'} · Source: [tabs/${t.slug}/index.html](../../tabs/${t.slug}/index.html)${usesApp ? ' · Drawn by [assets/app.js](../../assets/app.js) from [assets/data.js](../../assets/data.js)' : ''} · Where each section comes from: [code map](../code-map.md#${t.slug})
> Controls on the page (market pickers, version switches, filters, "show more") change the view; this snapshot shows their default state. The data behind every state is in [assets/data.js](../../assets/data.js), described in the [data dictionary](../data-dictionary.md).

${md}`);
  console.log('docs/tabs/' + t.slug + '.md', (md.length / 1024).toFixed(0) + ' KB');
}

// ---------- 2. code map ----------
const appLines = APP.split('\n');
const fnAt = []; // [start line, name]
appLines.forEach((l, i) => { const m = l.match(/^\s{2}(?:async )?function (\w+)\(/) || l.match(/^\s{2}const (\w+) = (?:\([^)]*\)|\w+) =>/); if (m) fnAt.push([i, m[1]]); });
const enclosing = i => { let f = null; for (const x of fnAt) if (x[0] <= i) f = x; return f; };
const fnEnd = start => { const next = fnAt.find(x => x[0] > start); return next ? next[0] - 1 : appLines.length - 1; };
// Aliases such as `const D = PAYLOAD.data, L = PAYLOAD.listing` or `const US = D.board.US`.
const alias = { PAYLOAD: '', NEWMETA: 'NEWMETA' };
for (let pass = 0; pass < 3; pass++) {
  for (const m of APP.matchAll(/\b([A-Z]\w*) = (PAYLOAD|NEWMETA|[A-Z][A-Z0-9_]*)((?:\.\w+)+)(?=[\s,;)])/g)) {
    if (m[1] in alias || !(m[2] in alias)) continue;
    alias[m[1]] = (alias[m[2]] ? alias[m[2]] + '.' : '') + m[3].slice(1);
  }
  // Derived lists such as `PROF = D.profiles.filter(...)` or `A = D.apps.map(...)` read the same data.
  for (const m of APP.matchAll(/\b([A-Z]\w*) = (PAYLOAD|NEWMETA|[A-Z][A-Z0-9_]*)((?:\.[a-zA-Z_]\w*)+?)\.(?:filter|find|map|slice|sort|concat|flatMap)\(/g)) {
    if (m[1] in alias || !(m[2] in alias)) continue;
    alias[m[1]] = (alias[m[2]] ? alias[m[2]] + '.' : '') + m[3].slice(1);
  }
}
function dataUsed(body) {
  const found = new Set();
  for (const [a, p] of Object.entries(alias)) {
    for (const m of body.matchAll(new RegExp('(?<![\\w.$\'"`])' + a + '(?![\\w$\'"`])((?:\\.[a-zA-Z_]\\w*)*)', 'g'))) {
      const full = ((p ? p : '') + m[1]).replace(/\.(map|filter|find|findIndex|slice|some|every|reduce|forEach|length|includes|indexOf|join|sort|concat|flatMap|keys|values|entries|toFixed|replace|split|trim|toLowerCase|test|match)$/, '').replace(/^\./, '');
      if (full) found.add(full.split('.').slice(0, 3).join('.'));
    }
  }
  const all = [...found];
  return all.filter(x => !all.some(y => y !== x && y.startsWith(x + '.'))).sort();
}
function sectionsOf(html) {
  const out = [];
  const jump = {};
  for (const m of html.matchAll(/<a href="#([\w-]+)"[^>]*>([^<]+)<\/a>/g)) if (!jump[m[1]]) jump[m[1]] = m[2].replace(/&amp;/g, '&');
  for (const m of html.matchAll(/<(section|header|footer|main)\b[^>]*\bid="([\w-]+)"[^>]*>/g)) {
    const tag = m[1], id = m[2], start = m.index;
    const end = html.indexOf(`</${tag}>`, start);
    const chunk = html.slice(start, end < 0 ? start + 4000 : end);
    const h = chunk.match(/<h[1-3][^>]*>([\s\S]*?)<\/h[1-3]>/);
    const heading = h ? h[1].replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').replace(/\s+/g, ' ').trim() : '';
    const ids = [...chunk.matchAll(/\bid="([\w-]+)"/g)].map(x => x[1]);
    const line = html.slice(0, start).split('\n').length;
    out.push({ id, tag, heading, jump: jump[id] || '', ids, line });
  }
  return out;
}
let map = `# Code map

> **Generated file: do not edit by hand.** Produced by \`node tools/export-docs.js\`, which GitHub runs after every push.
> For every section of every tab: the anchor id, where its markup is (file and line), which function in [assets/app.js](../assets/app.js) fills it, and which fields of [assets/data.js](../assets/data.js) that function reads (paths as in the [data dictionary](data-dictionary.md)). To change a section's wording, edit the markup for static text or the named function for text built from data; to change numbers, edit the data.

`;
for (const t of pages) {
  const html = fs.readFileSync(t.file, 'utf8').replace(/\r\n/g, '\n');
  const usesApp = /assets\/app\.js/.test(html);
  const page = (html.match(/<body data-page="([\w-]+)"/) || [])[1] || '';
  map += `<a id="${t.slug}"></a>\n\n## ${t.label}\n\nMarkup: [tabs/${t.slug}/index.html](../tabs/${t.slug}/index.html) · \`<body data-page="${page}">\` · ${usesApp ? 'content drawn by assets/app.js' : 'self-contained page (static HTML plus the inline script at the bottom of the file)'} · [text snapshot](tabs/${t.slug}.md)\n\n`;
  map += '| Section | Menu label | Heading in the markup | Markup line | Filled by (assets/app.js) | Data read |\n| --- | --- | --- | --- | --- | --- |\n';
  for (const s of sectionsOf(html)) {
    const fns = new Map();
    if (usesApp) for (const id of s.ids) {
      appLines.forEach((l, i) => {
        if (l.includes(`getElementById('${id}')`) || l.includes(`on('${id}'`) || l.includes(`'#${id}`)) {
          const f = enclosing(i);
          if (f) fns.set(f[1], f[0]);
        }
      });
    }
    const fnCells = [...fns].map(([n, s0]) => `\`${n}()\` [L${s0 + 1}-${fnEnd(s0) + 1}](../assets/app.js#L${s0 + 1})`).join('<br>') || (usesApp ? 'static markup' : 'static markup / inline script');
    const data = usesApp ? [...new Set([...fns].flatMap(([, s0]) => dataUsed(appLines.slice(s0, fnEnd(s0) + 1).join('\n'))))].slice(0, 14).map(p => '`' + p + '`').join(', ') : '';
    map += `| [#${s.id}](tabs/${t.slug}.md#${s.id}) | ${s.jump.replace(/\|/g, '\\|')} | ${s.heading.replace(/\|/g, '\\|') || '(built by script)'} | [L${s.line}](../tabs/${t.slug}/index.html#L${s.line}) | ${fnCells} | ${data} |\n`;
  }
  map += '\n';
}
if (hasApp) {
  map += `## All functions in assets/app.js\n\n| Function | Lines | Data read |\n| --- | --- | --- |\n`;
  for (const [s0, n] of fnAt) map += `| \`${n}\` | [L${s0 + 1}-${fnEnd(s0) + 1}](../assets/app.js#L${s0 + 1}) | ${dataUsed(appLines.slice(s0, fnEnd(s0) + 1).join('\n')).slice(0, 12).map(p => '`' + p + '`').join(', ')} |\n`;
}
write('docs/code-map.md', map);
console.log('docs/code-map.md');

// ---------- shared: outline of any JSON value ----------
const ex = v => { const s = typeof v === 'string' ? JSON.stringify(v.length > 70 ? v.slice(0, 70) + '…' : v) : JSON.stringify(v); return '`' + String(s).replace(/`/g, "'").replace(/\|/g, '\\|') + '`'; };
const kind = v => v === null ? 'null' : Array.isArray(v) ? 'array' : typeof v;
const isMap = o => { const k = Object.keys(o); if (k.length < 4) return false; const shapes = new Set(Object.values(o).map(v => kind(v) + (v && typeof v === 'object' ? ':' + Object.keys(v).slice(0, 5).join(',') : ''))); return shapes.size === 1 && k.every(x => /^[A-Z]{2}$|^\d+$|^[a-z0-9]+(\.[a-z0-9_]+){2,}$|^ds:/.test(x)); };
function outline(entries, maxDepth, tuples = {}) {
  const lines = [];
  function describe(p, v, depth, full) {
    const ind = '  '.repeat(depth);
    const k = kind(v);
    if (k === 'array') {
      if (!v.length) { lines.push(`${ind}- \`${p}\` · empty array`); return; }
      const kinds = [...new Set(v.map(kind))];
      if (kinds.length === 1 && kinds[0] === 'array' && (tuples[full] || v.every(x => x.length === v[0].length) && v[0].length > 2 && v[0].some(y => typeof y !== typeof v[0][0]))) {
        const lab = tuples[full] || {};
        lines.push(`${ind}- \`${p}[]\` · array of ${v.length} records, each an array of ${v[0].length} values:`);
        v[0].forEach((y, i) => {
          const col = v.slice(0, 400).map(r => r[i]);
          const types = [...new Set(col.map(kind))].join(' or ');
          const sample = col.find(z => z !== null && z !== undefined && z !== '' && z !== 0);
          lines.push(`${ind}  - \`[${i}]\`${lab[i] ? ' (`' + lab[i] + '`)' : ''} · ${types} · e.g. ${ex(sample === undefined ? y : sample)}`);
        });
        return;
      }
      if (kinds.every(x => x !== 'object' && x !== 'array')) { lines.push(`${ind}- \`${p}[]\` · array of ${v.length} ${kinds.join('/')} · e.g. ${ex(v.slice(0, 4))}`); return; }
      if (kinds.length === 1 && kinds[0] === 'array') { lines.push(`${ind}- \`${p}[][]\` · array of ${v.length} arrays · e.g. ${ex(v[0].slice(0, 6))}`); return; }
      const merged = {};
      v.slice(0, 400).forEach(o => { if (o && typeof o === 'object' && !Array.isArray(o)) for (const [kk, vv] of Object.entries(o)) if (!(kk in merged) || merged[kk] == null) merged[kk] = vv; });
      lines.push(`${ind}- \`${p}[]\` · array of ${v.length} objects${depth < maxDepth ? ':' : ' with keys ' + Object.keys(merged).slice(0, 20).map(x => '`' + x + '`').join(', ')}`);
      if (depth < maxDepth) for (const [kk, vv] of Object.entries(merged)) describe(kk, vv, depth + 1, full + '[].' + kk);
      return;
    }
    if (k === 'object') {
      const keys = Object.keys(v);
      if (isMap(v)) {
        lines.push(`${ind}- \`${p}{}\` · object keyed by ${keys.length} keys (${keys.slice(0, 12).join(', ')}${keys.length > 12 ? ', …' : ''}); each value:`);
        describe('<key>', v[keys[0]], depth + 1, full + '.<key>');
        return;
      }
      lines.push(`${ind}- \`${p}\` · object with ${keys.length} keys${depth < maxDepth ? ':' : ': ' + keys.slice(0, 20).map(x => '`' + x + '`').join(', ')}`);
      if (depth < maxDepth) for (const kk of keys) describe(kk, v[kk], depth + 1, full + '.' + kk);
      return;
    }
    lines.push(`${ind}- \`${p}\` · ${k} · e.g. ${ex(v)}`);
  }
  for (const [kk, vv] of entries) describe(kk, vv, 0, kk);
  return lines;
}

// ---------- 3. data dictionary ----------
if (fs.existsSync(path.join(ROOT, 'assets/data.js'))) {
  const ctx = {};
  vm.runInNewContext(read('assets/data.js') + '\n;this.__D = { PAYLOAD: typeof PAYLOAD !== "undefined" ? PAYLOAD : undefined, NEWMETA: typeof NEWMETA !== "undefined" ? NEWMETA : undefined };', ctx);
  // Tuple labels from app.js, e.g. `D.apps.map(a => ({ id: a[0], t: a[1] }))`.
  const tuples = {};
  for (const m of APP.matchAll(/\b(\w+(?:\.\w+)*)\.map\((\w) => \(\{ ([^}]*)\}\)\)/g)) {
    const [head, ...rest] = m[1].split('.');
    if (!(head in alias)) continue;
    const p = [alias[head], ...rest].filter(Boolean).join('.');
    const labels = {};
    for (const x of m[3].matchAll(new RegExp('(\\w+): ' + m[2] + '\\[(\\d+)\\]', 'g'))) labels[x[2]] = x[1];
    if (Object.keys(labels).length) tuples[p] = labels;
  }
  let dict = `# Data dictionary

> **Generated file: do not edit by hand.** Produced by \`node tools/export-docs.js\` (GitHub runs it after every push) from [assets/data.js](../assets/data.js), which holds every number and text the data-driven tabs show.
> Paths are written from the top-level constant (\`PAYLOAD\`${ctx.__D.NEWMETA ? ' or `NEWMETA`' : ''}); \`[]\` marks an array, \`{}\` an object whose keys are values such as market codes. Array records that the site reads by position are labelled with the names [assets/app.js](../assets/app.js) gives them. To find which function reads a field, search app.js for its last path segment or see the [code map](code-map.md).

## Top level

| Constant · key | Type | Size |
| --- | --- | --- |
`;
  for (const [name, obj] of Object.entries(ctx.__D)) {
    if (!obj) continue;
    for (const [kk, vv] of Object.entries(obj)) dict += `| \`${name}.${kk}\` | ${kind(vv)} | ${Array.isArray(vv) ? vv.length + ' items' : vv && typeof vv === 'object' ? Object.keys(vv).length + ' keys' : ex(vv)} |\n`;
  }
  for (const [name, obj] of Object.entries(ctx.__D)) if (obj) dict += `\n## ${name}\n\n` + outline(Object.entries(obj), 5, tuples).join('\n') + '\n';
  write('docs/data-dictionary.md', dict);
  console.log('docs/data-dictionary.md', (dict.length / 1024).toFixed(0) + ' KB');
}

// ---------- 4. research index ----------
if (fs.existsSync(path.join(ROOT, 'research'))) {
  const walk = d => fs.readdirSync(d, { withFileTypes: true }).flatMap(e => e.isDirectory() ? walk(path.join(d, e.name)) : [path.join(d, e.name)]);
  const files = walk(path.join(ROOT, 'research')).map(f => rel(f)).sort();
  const size = f => fs.statSync(path.join(ROOT, f)).size;
  const kb = n => n >= 1048576 ? (n / 1048576).toFixed(1) + ' MB' : Math.max(1, Math.round(n / 1024)) + ' KB';
  const link = f => `[${path.posix.basename(f)}](${encodeURI(path.posix.relative('docs', f))})`;
  const text = f => fs.readFileSync(path.join(ROOT, f), 'utf8').replace(/^﻿/, '').replace(/\r\n?/g, '\n');
  const comments = (src, mark) => { const out = []; for (const l of src.split('\n').slice(0, 12)) { const m = l.match(mark); if (m) out.push(m[1].trim()); else if (out.length || l.trim()) break; } return out.filter(Boolean).join(' '); };
  const ioOf = src => {
    const reads = new Set(), writes = new Set();
    for (const m of src.matchAll(/(?:readFileSync|require|ReadAllText|Get-Content|Import-Csv)\s*\(?\s*(?:path\.join\([^,]*,\s*)?['"`]?\$?\{?[\w\\/.$-]*?([\w.-]+\.(?:json|txt|html|csv|md))['"`]/g)) reads.add(m[1]);
    for (const m of src.matchAll(/(?:writeFileSync|WriteAllText|Set-Content|Out-File|Export-Csv)\s*\(?\s*(?:path\.join\([^,]*,\s*)?['"`]?\$?\{?[\w\\/.$-]*?([\w.-]+\.(?:json|txt|html|csv|md|docx|pdf))['"`]/g)) writes.add(m[1]);
    return [...reads].length || [...writes].length ? ` Reads ${[...reads].map(x => '`' + x + '`').join(', ') || 'nothing on disk'}; writes ${[...writes].map(x => '`' + x + '`').join(', ') || 'nothing on disk'}.` : '';
  };
  const byDir = {};
  for (const f of files) (byDir[path.posix.dirname(f)] = byDir[path.posix.dirname(f)] || []).push(f);
  let idx = `# Research index

> **Generated file: do not edit by hand.** Produced by \`node tools/export-docs.js\` (GitHub runs it after every push). Every file in [research/](../research/), folder by folder: what each script does and which files it reads and writes, the structure of each data file, and the full text of short notes. Reports saved as PDF, Word or RTF have a Markdown text version next to them. The hand-written overview of the studies is [research/README.md](../research/README.md).

`;
  for (const [dir, list] of Object.entries(byDir)) {
    const total = list.reduce((s, f) => s + size(f), 0);
    idx += `## ${dir}/\n\n${list.length} files · ${kb(total)}\n\n`;
    const exts = [...new Set(list.map(f => path.extname(f).toLowerCase()))];
    if (list.length > 40 && exts.length === 1) {
      idx += `A cache of ${list.length} ${exts[0]} files named by a hash of the request that produced them: raw responses saved by the scraper so a run can be repeated without fetching again. Delete the folder to force a fresh scrape.\n\n`;
      continue;
    }
    const images = list.filter(f => /\.(png|jpe?g|webp|gif)$/i.test(f));
    if (images.length) idx += `Images: ${images.map(f => link(f) + ' (' + kb(size(f)) + ')').join(', ')}\n\n`;
    for (const f of list.filter(x => !images.includes(x))) {
      const ext = path.extname(f).toLowerCase(), n = size(f);
      let line = `- **${link(f)}** · ${kb(n)}`;
      try {
        if (ext === '.js') { const s = text(f); line += ` · Node script, ${s.split('\n').length} lines. ${comments(s, /^\s*\/\/\s?(.*)$/) || ''}${ioOf(s)}`; }
        else if (ext === '.ps1') { const s = text(f); const fns = [...s.matchAll(/^function ([\w-]+)/gm)].map(m => m[1]); line += ` · PowerShell script, ${s.split('\n').length} lines. ${comments(s, /^\s*#\s?(.*)$/) || ''}${fns.length ? ' Functions: ' + fns.map(x => '`' + x + '`').join(', ') + '.' : ''}${ioOf(s)}`; }
        else if (ext === '.json') {
          let v; try { v = JSON.parse(text(f)); } catch (e) { line += ' · JSON (could not be parsed)'; idx += line + '\n'; continue; }
          const top = Array.isArray(v) ? `array of ${v.length}` : `object with ${Object.keys(v).length} keys`;
          line += ` · JSON, ${top}:\n` + outline(Array.isArray(v) ? [['(root)', v]] : Object.entries(v), 1).map(l => '  ' + l).join('\n');
        }
        else if (ext === '.md') { const s = text(f); const hs = [...s.matchAll(/^#{1,3} (.+)$/gm)].map(m => m[1]).slice(0, 14); line += ` · Markdown${hs.length ? ': ' + hs.map(h => '“' + h.replace(/\|/g, '/') + '”').join(', ') : ''}`; }
        else if (ext === '.txt' || ext === '.csv') { const s = text(f); line += n <= 4096 ? ` · full text:\n\n  \`\`\`text\n${s.trim().split('\n').map(l => '  ' + l).join('\n')}\n  \`\`\`` : ` · first lines:\n\n  \`\`\`text\n${s.split('\n').slice(0, 15).map(l => '  ' + l).join('\n')}\n  \`\`\``; }
        else if (ext === '.html') { const s = text(f); const t = (s.match(/<title>([^<]*)<\/title>/i) || [])[1]; line += ` · HTML page${t ? ': “' + t.trim() + '”' : ''}`; }
        else if (['.pdf', '.docx', '.rtf', '.doc'].includes(ext)) { const md = f.replace(/\.[^.]+$/, '.md'); line += ` · ${ext.slice(1).toUpperCase()}${fs.existsSync(path.join(ROOT, md)) ? ' · text version: ' + link(md) : ''}`; }
      } catch (e) { line += ' · (could not be read)'; }
      idx += line + '\n';
    }
    idx += '\n';
  }
  write('docs/research-index.md', idx);
  console.log('docs/research-index.md', (idx.length / 1024).toFixed(0) + ' KB');
}

// ---------- 5. backend per tab: the code that draws it and the data it reads, in full ----------
function pretty(v, ind = 0) {
  const W = 150, pad = '  '.repeat(ind), pad1 = '  '.repeat(ind + 1);
  if (v === null || typeof v !== 'object') return JSON.stringify(v);
  const flat = JSON.stringify(v);
  if (flat.length + pad.length <= W && !/[{[].*[{[].*[{[]/.test(flat)) return flat;
  if (Array.isArray(v)) {
    if (!v.length) return '[]';
    if (v.every(x => x === null || typeof x !== 'object' || (Array.isArray(x) && x.every(y => y === null || typeof y !== 'object') && JSON.stringify(x).length < 40))) {
      const rows = []; let cur = '';
      for (const p of v.map(x => JSON.stringify(x))) { if (cur && pad1.length + cur.length + p.length + 2 > W) { rows.push(cur); cur = ''; } cur += (cur ? ', ' : '') + p; }
      if (cur) rows.push(cur);
      return '[\n' + rows.map(r => pad1 + r).join(',\n') + '\n' + pad + ']';
    }
    return '[\n' + v.map(x => pad1 + pretty(x, ind + 1)).join(',\n') + '\n' + pad + ']';
  }
  const keys = Object.keys(v);
  return keys.length ? '{\n' + keys.map(k => pad1 + JSON.stringify(k) + ': ' + pretty(v[k], ind + 1)).join(',\n') + '\n' + pad + '}' : '{}';
}
const fence = (lang, code) => { const f = /```/.test(code) ? '````' : '```'; return `${f}${lang}\n${code.replace(/\s+$/, '')}\n${f}\n`; };
const DATA = (() => {
  if (!fs.existsSync(path.join(ROOT, 'assets/data.js'))) return {};
  const ctx = {};
  vm.runInNewContext(read('assets/data.js') + '\n;this.__D = { PAYLOAD: typeof PAYLOAD !== "undefined" ? PAYLOAD : undefined, NEWMETA: typeof NEWMETA !== "undefined" ? NEWMETA : undefined };', ctx);
  return ctx.__D;
})();
const getPath = p => { const parts = p.split('.'); let v = parts[0] === 'NEWMETA' ? DATA.NEWMETA : DATA.PAYLOAD; for (const x of parts[0] === 'NEWMETA' ? parts.slice(1) : parts) { if (v == null) return undefined; v = v[x]; } return v; };
const fnNames = new Set(fnAt.map(x => x[1]));
const firstFn = fnAt.find(([i]) => /^\s{2}(?:async )?function /.test(appLines[i]));
const setupEnd = firstFn ? firstFn[0] : 0;
const tailStart = appLines.findIndex(l => /^\s*\/\/ -+ page -+/.test(l));
fs.mkdirSync(path.join(ROOT, 'docs/backend'), { recursive: true });
for (const t of pages) {
  const html = fs.readFileSync(t.file, 'utf8').replace(/\r\n/g, '\n');
  const usesApp = /assets\/app\.js/.test(html);
  const page = (html.match(/<body data-page="([\w-]+)"/) || [])[1] || '';
  let md = `# ${t.label}: code and data

> **Generated file: do not edit by hand.** Produced by \`node tools/export-docs.js\` (GitHub runs it after every push).
> Everything behind the [${t.label}](../../tabs/${t.slug}/index.html) tab in one place: how the page is put together, the full source of the code that draws it, and the full data it reads. **Load it when a question or change concerns how this tab works** (its calculations, data, filters or behaviour); wording-only edits do not need it. The visible text is in [docs/tabs/${t.slug}.md](../tabs/${t.slug}.md); where the data came from is in [research.md](research.md).

## How the page is put together

- Markup: [tabs/${t.slug}/index.html](../../tabs/${t.slug}/index.html) (${html.split('\n').length} lines), \`<body data-page="${page}">\`
- ${usesApp ? 'Drawn by [assets/app.js](../../assets/app.js) from [assets/data.js](../../assets/data.js); styles in [assets/site.css](../../assets/site.css)' : 'Self-contained: static HTML with its own styles and the inline script below'}; tab bar from [assets/nav.js](../../assets/nav.js)
- Sections and the functions that fill them: see the [code map](../code-map.md#${t.slug})

`;
  if (usesApp) {
    const want = new Set();
    for (const s of sectionsOf(html)) for (const id of s.ids) appLines.forEach((l, i) => { if (l.includes(`getElementById('${id}')`) || l.includes(`on('${id}'`) || l.includes(`'#${id}`)) { const f = enclosing(i); if (f) want.add(f[1]); } });
    const tail = tailStart >= 0 ? appLines.slice(tailStart).join('\n') : '';
    const branch = tail.match(new RegExp(`PAGE === '${page}'\\) \\{?([\\s\\S]*?)(?:\\n  \\}|\\} else)`));
    if (branch) for (const m of branch[1].matchAll(/\b(\w+)\(/g)) if (fnNames.has(m[1])) want.add(m[1]);
    for (let pass = 0; pass < 3; pass++) for (const n of [...want]) { const f = fnAt.find(x => x[1] === n); if (!f) continue; for (const m of appLines.slice(f[0], fnEnd(f[0]) + 1).join('\n').matchAll(/\b(\w+)\(/g)) if (fnNames.has(m[1]) && m[1] !== n) want.add(m[1]); }
    const ordered = fnAt.filter(([, n]) => want.has(n) && /^\s{2}(?:async )?function /.test(appLines[fnAt.find(x => x[1] === n)[0]]));
    md += `## Code\n\n### Shared setup: constants and helpers (assets/app.js L1-${setupEnd})\n\n${fence('js', appLines.slice(0, setupEnd).join('\n'))}\n`;
    for (const [s0, n] of ordered) md += `### \`${n}()\` (assets/app.js L${s0 + 1}-${fnEnd(s0) + 1})\n\n${fence('js', appLines.slice(s0, fnEnd(s0) + 1).join('\n'))}\n`;
    if (tailStart >= 0) md += `### Page start-up (assets/app.js L${tailStart + 1}-${appLines.length}); the \`PAGE === '${page}'\` branch runs for this tab\n\n${fence('js', tail)}\n`;
    const used = new Set();
    for (const [s0] of ordered) for (const p of dataUsed(appLines.slice(s0, fnEnd(s0) + 1).join('\n'))) used.add(p.startsWith('NEWMETA') ? 'NEWMETA' : p.split('.').slice(0, 2).join('.'));
    for (const p of dataUsed(appLines.slice(0, setupEnd).join('\n'))) if ([...used].some(u => u.split('.')[0] === p.split('.')[0])) used.add(p.split('.').slice(0, 2).join('.'));
    const paths = [...used].filter(p => !([...used].some(q => q !== p && p.startsWith(q + '.')))).sort();
    md += `## Data this tab reads\n\n${paths.map(p => `- [\`${p}\`](#${p.replace(/\./g, '').toLowerCase()})`).join('\n')}\n\nThese are exact copies of the values in [assets/data.js](../../assets/data.js); edit them there. Field meanings are in the [data dictionary](../data-dictionary.md).\n\n`;
    for (const p of paths) { const v = getPath(p); if (v === undefined) continue; md += `### ${p}\n\n${fence('json', pretty(v))}\n`; }
  } else {
    const scripts = [...html.matchAll(/<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/g)].map(m => m[1]).filter(s => s.trim());
    const styles = [...html.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/g)].map(m => m[1]).filter(s => s.trim());
    md += `## Code\n\nThe page's content is static HTML in [index.html](../../tabs/${t.slug}/index.html); its text is in [docs/tabs/${t.slug}.md](../tabs/${t.slug}.md). Its inline script${scripts.length === 1 ? '' : 's'}, in full:\n\n${scripts.map(s => fence('js', s.trim())).join('\n')}\n`;
    if (styles.length) md += `### Styles\n\n${styles.map(s => fence('css', s.trim())).join('\n')}\n`;
    md += `## Data this tab reads\n\nNone from \`assets/data.js\`: every number is in the page itself${scripts.some(s => /var \w+=\[|const \w+ ?= ?\[/.test(s)) ? ', including the chart data in the script above' : ''}.\n`;
  }
  write(`docs/backend/${t.slug}.md`, md);
  console.log(`docs/backend/${t.slug}.md`, (md.length / 1024).toFixed(0) + ' KB');
}

// ---------- 6. research scripts and small data files, in full ----------
if (fs.existsSync(path.join(ROOT, 'research'))) {
  const walk = d => fs.readdirSync(d, { withFileTypes: true }).flatMap(e => e.isDirectory() ? walk(path.join(d, e.name)) : [path.join(d, e.name)]);
  const all = walk(path.join(ROOT, 'research')).map(f => rel(f)).sort();
  const cacheDirs = new Set(Object.entries(all.reduce((m, f) => { const d = path.posix.dirname(f); m[d] = (m[d] || 0) + 1; return m; }, {})).filter(([, n]) => n > 40).map(([d]) => d));
  const text = f => fs.readFileSync(path.join(ROOT, f), 'utf8').replace(/^﻿/, '').replace(/\r\n?/g, '\n');
  const size = f => fs.statSync(path.join(ROOT, f)).size;
  const scripts = all.filter(f => /\.(js|ps1|py|sh)$/i.test(f) && !cacheDirs.has(path.posix.dirname(f)));
  const smallData = all.filter(f => /\.(json|csv|txt)$/i.test(f) && !cacheDirs.has(path.posix.dirname(f)) && size(f) <= 60 * 1024);
  const bigData = all.filter(f => /\.(json|csv)$/i.test(f) && !cacheDirs.has(path.posix.dirname(f)) && size(f) > 60 * 1024);
  let md = `# Research: scripts and data in full

> **Generated file: do not edit by hand.** Produced by \`node tools/export-docs.js\` (GitHub runs it after every push).
> The full source of every script in [research/](../../research/), then every small data file (up to 60 KB) in full. Large data files are listed with their structure in the [research index](../research-index.md) and are best searched in place. The overview of the studies is [research/README.md](../../research/README.md). **Load this file when a question or change concerns how the data was collected or scored.**

## Contents

${scripts.map(f => `- [${f}](#${f.replace(/[^\w-]/g, '').toLowerCase()})`).join('\n')}
${smallData.map(f => `- [${f}](#${f.replace(/[^\w-]/g, '').toLowerCase()})`).join('\n')}

## Scripts

`;
  for (const f of scripts) md += `### ${f}\n\n${fence(f.endsWith('.ps1') ? 'powershell' : f.endsWith('.py') ? 'python' : f.endsWith('.sh') ? 'bash' : 'js', text(f))}\n`;
  md += `## Small data files\n\n`;
  for (const f of smallData) {
    let body = text(f);
    if (f.endsWith('.json')) { try { body = pretty(JSON.parse(body)); } catch (e) { /* keep as is */ } }
    md += `### ${f}\n\n${fence(f.endsWith('.json') ? 'json' : f.endsWith('.csv') ? 'csv' : 'text', body)}\n`;
  }
  md += `## Large data files (structure in the research index)\n\n${bigData.map(f => `- [${f}](../../${encodeURI(f)}) · ${(size(f) / 1024).toFixed(0)} KB`).join('\n')}\n`;
  if (cacheDirs.size) md += `\nRaw response caches (not listed file by file): ${[...cacheDirs].map(d => '`' + d + '/`').join(', ')}.\n`;
  write('docs/backend/research.md', md);
  console.log('docs/backend/research.md', (md.length / 1024).toFixed(0) + ' KB');
}
