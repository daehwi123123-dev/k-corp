// index.html → web/ 폴더 (설치형 웹앱, PWA). 게임을 고친 뒤 `node build-web.mjs`로 다시 만드세요.
import fs from 'node:fs';
import zlib from 'node:zlib';

const OUT = 'web';
fs.mkdirSync(OUT, { recursive: true });
const VERSION = Date.now().toString(36);

// ---- index.html: 앱 설치용 태그 추가 ----
let html = fs.readFileSync('index.html', 'utf8');
html = html.replace(
  /<meta name="viewport"[^>]*>/,
  `<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<meta name="theme-color" content="#2563eb">
<meta name="description" content="랜덤으로 주어진 한국 회사를 스타트업에서 재벌까지 키우는 경영 시뮬레이션">
<link rel="manifest" href="manifest.webmanifest">
<link rel="icon" href="icon-192.png">
<link rel="apple-touch-icon" href="apple-touch-icon.png">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="default">
<meta name="apple-mobile-web-app-title" content="재벌까지">`
);
html = html.replace('</style>', `
@media (display-mode: standalone){#scroller{padding-top:env(safe-area-inset-top,0px)}}
</style>`);
html = html.replace('</body>', `<script>
if('serviceWorker' in navigator&&location.protocol!=='file:')addEventListener('load',()=>navigator.serviceWorker.register('sw.js').catch(()=>{}));
</script>
</body>`);
fs.writeFileSync(`${OUT}/index.html`, html);

// ---- manifest ----
fs.writeFileSync(`${OUT}/manifest.webmanifest`, JSON.stringify({
  name: '재벌까지',
  short_name: '재벌까지',
  description: '랜덤으로 주어진 한국 회사를 스타트업에서 재벌까지 키우는 경영 시뮬레이션',
  lang: 'ko',
  start_url: './',
  scope: './',
  display: 'standalone',
  orientation: 'portrait',
  background_color: '#f4f5f7',
  theme_color: '#2563eb',
  icons: [
    { src: 'icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
    { src: 'icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
    { src: 'icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
  ],
}, null, 2));

// ---- service worker: 오프라인에서도 실행, 새 버전은 온라인일 때 받아옴 ----
fs.writeFileSync(`${OUT}/sw.js`, `const C='kcorp-${VERSION}';
const FILES=['./','index.html','manifest.webmanifest','icon-192.png','icon-512.png','apple-touch-icon.png'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(C).then(c=>c.addAll(FILES)));self.skipWaiting()});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==C).map(k=>caches.delete(k)))).then(()=>self.clients.claim()))});
self.addEventListener('fetch',e=>{
  if(e.request.method!=='GET'||new URL(e.request.url).origin!==location.origin)return;
  e.respondWith(fetch(e.request).then(r=>{const cp=r.clone();caches.open(C).then(c=>c.put(e.request,cp));return r}).catch(()=>caches.match(e.request,{ignoreSearch:true}).then(r=>r||caches.match('index.html'))));
});
`);

// ---- 아이콘 (PNG 직접 그리기: 파란 배경 + 성장하는 빌딩 3개) ----
function png(size, pad, rounded) {
  const px = new Uint8Array(size * size * 4);
  const set = (x, y, [r, g, b, a = 255]) => { const i = (y * size + x) * 4; px[i] = r; px[i + 1] = g; px[i + 2] = b; px[i + 3] = a; };
  const R = rounded ? size * 0.22 : 0;
  const inRound = (x, y) => {
    const cx = Math.min(Math.max(x, R), size - 1 - R), cy = Math.min(Math.max(y, R), size - 1 - R);
    return (x - cx) ** 2 + (y - cy) ** 2 <= R * R;
  };
  const s = (size * (1 - 2 * pad)) / 100, o = size * pad; // 100x100 그리드 → 픽셀
  const bldg = [ // x, top, w (그리드 좌표), 바닥 y=80
    { x: 16, t: 56, w: 18 }, { x: 41, t: 40, w: 18 }, { x: 66, t: 20, w: 18 },
  ];
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
    if (!inRound(x, y)) { set(x, y, [0, 0, 0, 0]); continue; }
    const t = y / size; // 위→아래 그라데이션
    let c = [Math.round(37 + 30 * t), Math.round(99 - 30 * t), Math.round(235 - 25 * t)];
    const gx = (x - o) / s, gy = (y - o) / s;
    for (const b of bldg) {
      if (gx >= b.x && gx < b.x + b.w && gy >= b.t && gy < 80) {
        c = [255, 255, 255];
        const wx = (gx - b.x - 3) % 6.5, wy = (gy - b.t - 4) % 8;
        if (gx > b.x + 3 && gx < b.x + b.w - 2 && gy > b.t + 4 && gy < 76 && wx >= 0 && wx < 3.5 && wy >= 0 && wy < 4) c = [147, 180, 255];
      }
    }
    if (gy >= 80 && gy < 84 && gx >= 10 && gx < 90) c = [255, 255, 255];
    // 상승 화살표 (오른쪽 위)
    set(x, y, c);
  }
  // PNG 인코딩
  const raw = Buffer.alloc((size * 4 + 1) * size);
  for (let y = 0; y < size; y++) { raw[y * (size * 4 + 1)] = 0; Buffer.from(px.buffer, y * size * 4, size * 4).copy(raw, y * (size * 4 + 1) + 1); }
  const crcT = Array.from({ length: 256 }, (_, n) => { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; return c >>> 0; });
  const crc = b => { let c = 0xffffffff; for (const v of b) c = crcT[(c ^ v) & 255] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; };
  const chunk = (type, data) => { const l = Buffer.alloc(4); l.writeUInt32BE(data.length); const td = Buffer.concat([Buffer.from(type), data]); const c = Buffer.alloc(4); c.writeUInt32BE(crc(td)); return Buffer.concat([l, td, c]); };
  const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(size, 0); ihdr.writeUInt32BE(size, 4); ihdr[8] = 8; ihdr[9] = 6;
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', ihdr), chunk('IDAT', zlib.deflateSync(raw)), chunk('IEND', Buffer.alloc(0))]);
}
fs.writeFileSync(`${OUT}/icon-192.png`, png(192, 0.1, true));
fs.writeFileSync(`${OUT}/icon-512.png`, png(512, 0.1, true));
fs.writeFileSync(`${OUT}/icon-maskable-512.png`, png(512, 0.2, false));
fs.writeFileSync(`${OUT}/apple-touch-icon.png`, png(180, 0.12, false));
console.log('web/ 생성 완료 (버전 ' + VERSION + ')');
