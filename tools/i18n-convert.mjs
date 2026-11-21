// 한 번만 실행: index.html 안의 한글 문자열을 L`...` 번역 함수로 감싸고, 번역 키 목록(i18n/keys.json)을 만든다.
// 사용: node tools/i18n-convert.mjs <acorn 경로>
import fs from 'node:fs';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const acorn = require(process.argv[2] || 'acorn');

const html = fs.readFileSync('index.html', 'utf8');
const s0 = html.indexOf('<script>\n') + '<script>\n'.length;
const s1 = html.indexOf('\n</script>', s0);
const src = html.slice(s0, s1);
const ast = acorn.parse(src, { ecmaVersion: 'latest', sourceType: 'script' });

const HANGUL = /[가-힣]/;
// 이름 재료는 번역하지 않는다(회사·사람 이름)
const SKIP_VARS = new Set(['LANGS', 'PRE', 'SUR', 'GIV', 'PWORD', 'NAMEGEN', 'NAMEGEN_F', 'FSUF']);
const SKIP_PROPS = new Set(['suffix', 'sur', 'giv', 'pre', 'typeLabel', 'style']);
// 내부 키로 쓰는 값(경쟁사 성향)은 번역하지 않는다
const SKIP_VALUES = new Set(['공격형', '기술형', '안정형', '마케팅형']);
const edits = [];
const keys = new Map(); // key -> region

function region(pos) {
  const ev0 = src.indexOf('const EVENTS=['), ev1 = src.indexOf('function rollEvent');
  const fx0 = src.indexOf('const FACTS={'), fx1 = src.indexOf('const factQ');
  if (pos > ev0 && pos < ev1) return 'events';
  if (pos > fx0 && pos < fx1) return 'facts';
  return 'ui';
}
function esc(v) { return v.replace(/\\/g, '\\\\').replace(/`/g, '\\`').replace(/\$\{/g, '\\${').replace(/\n/g, '\\n'); }

function walk(node, parent, skip) {
  if (!node || typeof node.type !== 'string') return;
  if (node.type === 'VariableDeclarator' && node.id && SKIP_VARS.has(node.id.name)) skip = true;
  if (node.type === 'Property' && !node.computed && node.key && SKIP_PROPS.has(node.key.name || node.key.value)) skip = true;
  if (!skip) {
    if (node.type === 'Literal' && typeof node.value === 'string' && HANGUL.test(node.value)) {
      const isKey = parent && parent.type === 'Property' && parent.key === node && !parent.computed;
      if (!isKey && !SKIP_VALUES.has(node.value)) { edits.push({ start: node.start, end: node.end, text: 'L`' + esc(node.value) + '`' }); keys.set(node.value, region(node.start)); }
    }
    if (node.type === 'TemplateLiteral' && node.quasis.some(q => HANGUL.test(q.value.cooked)) && !(parent && parent.type === 'TaggedTemplateExpression')) {
      edits.push({ start: node.start, end: node.start, text: 'L' });
      const key = node.quasis.map((q, i) => (i ? `{${i - 1}}` : '') + q.value.cooked).join('');
      keys.set(key, region(node.start));
    }
  }
  for (const k of Object.keys(node)) {
    if (k === 'parent') continue;
    const v = node[k];
    if (Array.isArray(v)) v.forEach(c => c && typeof c.type === 'string' && walk(c, node, skip));
    else if (v && typeof v.type === 'string') walk(v, node, skip);
  }
}
walk(ast, null, false);
edits.sort((a, b) => b.start - a.start);
let out = src;
for (const e of edits) out = out.slice(0, e.start) + e.text + out.slice(e.end);
fs.writeFileSync('index.html', html.slice(0, s0) + out + html.slice(s1));
fs.mkdirSync('i18n', { recursive: true });
const list = [...keys].map(([k, r]) => ({ k, r }));
fs.writeFileSync('i18n/keys.json', JSON.stringify(list, null, 1));
const by = list.reduce((a, x) => (a[x.r] = (a[x.r] || 0) + 1, a), {});
console.log('edits', edits.length, 'unique keys', list.length, by);
