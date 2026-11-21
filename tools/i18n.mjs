// 다국어 도구
//   node tools/i18n.mjs extract <acorn경로>  : index.html의 L`...` 문장을 모아 i18n/src/{ui,events,facts}.json(순서 목록) 갱신
//   node tools/i18n.mjs inline              : i18n/<영역>/<언어>.txt(번역)를 index.html 의 I18N 자리에 넣음
//   node tools/i18n.mjs check               : 번역의 {0} 자리표시와 HTML 태그 수가 원문과 맞는지 검사
// 번역 파일 형식: 한 줄에 '번호|번역' (번호는 i18n/src/<영역>.json 의 순서, 줄바꿈은 ⏎)
import fs from 'node:fs';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const AREAS = ['ui', 'events', 'facts'];
const LANGS = ['en', 'ja', 'zh', 'de', 'hi', 'es', 'vi'];
const NL = String.fromCharCode(10), CR = String.fromCharCode(13);
const cmd = process.argv[2];
const html = () => fs.readFileSync('index.html', 'utf8');

if (cmd === 'extract') {
  const acorn = require(process.argv[3] || 'acorn');
  const h = html(), s0 = h.indexOf('<script>' + NL) + 9, src = h.slice(s0, h.indexOf(NL + '</script>', s0));
  const ast = acorn.parse(src, { ecmaVersion: 'latest' });
  const ev0 = src.indexOf('const EVENTS=['), ev1 = src.indexOf('function rollEvent');
  const fx0 = src.indexOf('const FACTS={'), fx1 = src.indexOf('const factQ');
  const out = { ui: [], events: [], facts: [] }, seen = new Set();
  (function walk(n) {
    if (!n || typeof n.type !== 'string') return;
    if (n.type === 'TaggedTemplateExpression' && n.tag.type === 'Identifier' && n.tag.name === 'L') {
      const key = n.quasi.quasis.map((q, i) => (i ? `{${i - 1}}` : '') + q.value.cooked).join('');
      if (!seen.has(key)) { seen.add(key); const r = n.start > ev0 && n.start < ev1 ? 'events' : n.start > fx0 && n.start < fx1 ? 'facts' : 'ui'; out[r].push(key); }
    }
    for (const k in n) { const v = n[k]; if (Array.isArray(v)) v.forEach(walk); else if (v && typeof v.type === 'string') walk(v); }
  })(ast);
  fs.mkdirSync('i18n/src', { recursive: true });
  for (const a of AREAS) {
    const file = `i18n/src/${a}.json`;
    const old = fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, 'utf8')) : [];
    // 기존 순서는 유지하고 새 문장만 뒤에 붙인다(번역 번호가 밀리지 않게)
    const merged = old.slice();
    for (const k of out[a]) if (!merged.includes(k)) merged.push(k);
    fs.writeFileSync(file, JSON.stringify(merged, null, 0).split('","').join('",' + NL + '"'));
    console.log(a, out[a].length, 'in code,', merged.length, 'in list');
  }
}

function readArr(a, l) {
  const f = `i18n/${a}/${l}.txt`; if (!fs.existsSync(f)) return null;
  const arr = [];
  for (const raw of fs.readFileSync(f, 'utf8').split(NL)) {
    const line = raw.endsWith(CR) ? raw.slice(0, -1) : raw;
    const bar = line.indexOf('|'); const n = line.slice(0, bar);
    if (bar > 0 && /^[0-9]+$/.test(n)) arr[+n] = line.slice(bar + 1).split('⏎').join(NL);
  }
  return arr;
}
function srcOf(a) { const f = `i18n/src/${a}.json`; return fs.existsSync(f) ? JSON.parse(fs.readFileSync(f, 'utf8')) : null; }
function load() {
  const dict = {};
  for (const l of LANGS) dict[l] = {};
  for (const a of AREAS) {
    const src = srcOf(a); if (!src) continue;
    for (const l of LANGS) {
      const arr = readArr(a, l); if (!arr) continue;
      src.forEach((k, i) => { if (arr[i] != null && arr[i] !== '') dict[l][k] = arr[i]; });
    }
  }
  return dict;
}

if (cmd === 'check') {
  const ph = s => (s.match(/\{[0-9]+\}/g) || []).sort().join(',');
  const tags = s => (s.match(/<\/?[a-z][a-z0-9]*/gi) || []).length;
  let bad = 0;
  for (const a of AREAS) {
    const src = srcOf(a); if (!src) continue;
    for (const l of LANGS) {
      const arr = readArr(a, l); if (!arr) continue;
      const missing = src.filter((k, i) => arr[i] == null).length; if (missing) console.log(`${a}/${l}: ${missing} missing`);
      src.forEach((k, i) => {
        const v = arr[i]; if (v == null || v === '') return;
        if (ph(k) !== ph(v)) { console.log(`${a}/${l}#${i} placeholders`, ph(k), '!=', ph(v)); bad++; }
        if (tags(k) !== tags(v)) { console.log(`${a}/${l}#${i} tags`, tags(k), '!=', tags(v)); bad++; }
      });
    }
  }
  console.log(bad ? `${bad} problems` : 'all good');
}

if (cmd === 'inline') {
  const dict = load(), h = html();
  const json = JSON.stringify(dict);
  const out = h.replace(/\/\*I18N\*\/[\s\S]*?\/\*I18N-END\*\//, () => `/*I18N*/${json}/*I18N-END*/`);
  fs.writeFileSync('index.html', out);
  console.log('inlined', Object.fromEntries(Object.entries(dict).map(([l, d]) => [l, Object.keys(d).length])), Math.round(json.length / 1024) + 'KB');
}
