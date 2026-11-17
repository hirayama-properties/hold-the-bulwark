// Builds the legal pages (privacy / terms / tokusho) from build/legal/*.md
// usage: node legal.mjs <outDir> <siteUrl>
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const [, , OUT, SITE_URL_IN] = process.argv;
const SITE_URL = (SITE_URL_IN || 'https://example.com/').replace(/\/?$/, '/');
const FONT = 'https://fonts.googleapis.com/css2?family=Cinzel:wght@700;900&family=Dela+Gothic+One&family=Noto+Sans+JP:wght@400;500;700;900&display=swap';

const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const inline = (s) => {
  const links = [];
  s = s.replace(/\[([^\]]+)\]\((https?:[^)]+)\)/g, (_, t, u) => { links.push(`<a href="${esc(u)}" target="_blank" rel="noopener">${esc(t)}</a>`); return `\u0000${links.length - 1}\u0000`; });
  return esc(s)
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/https?:\/\/[^\s）)]+/g, (u) => `<a href="${u}" target="_blank" rel="noopener">${u}</a>`)
    .replace(/[\w.+-]+@[\w-]+\.[\w.]+/g, (m) => `<a href="mailto:${m}">${m}</a>`)
    .replace(/\u0000(\d+)\u0000/g, (_, i) => links[+i]);
};

function md(src) {
  const out = [];
  let list = null, para = [], table = [];
  const flushPara = () => { if (para.length) { out.push(`<p>${para.map(inline).join('<br>')}</p>`); para = []; } };
  const flushList = () => { if (list) { out.push(`<${list.tag}>${list.items.map((i) => `<li>${inline(i)}</li>`).join('')}</${list.tag}>`); list = null; } };
  const flushTable = () => {
    if (table.length) {
      out.push(`<table class="legal-table"><tbody>${table.map(([k, v]) => `<tr><th scope="row">${inline(k)}</th><td>${inline(v)}</td></tr>`).join('')}</tbody></table>`);
      table = [];
    }
  };
  const flushAll = () => { flushPara(); flushList(); flushTable(); };
  for (const line of src.split('\n')) {
    let m;
    if (!line.trim()) { flushAll(); continue; }
    if ((m = line.match(/^### (.+)/))) { flushAll(); out.push(`<h2>${inline(m[1])}</h2>`); continue; }
    if ((m = line.match(/^\*\*(.+)\*\*$/))) { flushAll(); out.push(`<h3>${inline(m[1])}</h3>`); continue; }
    if ((m = line.match(/^\|\s*(.+?)\s*\|\s*(.+?)\s*\|$/))) { flushPara(); flushList(); table.push([m[1], m[2]]); continue; }
    if ((m = line.match(/^- (.+)/))) { flushPara(); flushTable(); if (!list || list.tag !== 'ul') { flushList(); list = { tag: 'ul', items: [] }; } list.items.push(m[1]); continue; }
    if ((m = line.match(/^\d+\. (.+)/))) { flushPara(); flushTable(); if (!list || list.tag !== 'ol') { flushList(); list = { tag: 'ol', items: [] }; } list.items.push(m[1]); continue; }
    flushList(); flushTable();
    if (/^(最終更新日|Last updated)/.test(line)) { out.push(`<p class="legal-updated">${inline(line)}</p>`); continue; }
    para.push(line);
  }
  flushAll();
  return out.join('\n');
}

const T = {
  ja: {
    home: 'トップへ戻る', privacy: 'プライバシーポリシー', terms: '利用規約', tokusho: '特定商取引法に基づく表記', contact: 'お問い合わせ',
    operator: '運営：Hirayama Properties K.K.（平山プロパティーズ株式会社）',
    tm: 'Google Play および Google Play ロゴは Google LLC の商標です。App Store は Apple Inc. のサービスマークです。',
    site: 'HOLD THE BULWARK 公式サイト',
  },
  en: {
    home: 'Back to top', privacy: 'Privacy Policy', terms: 'Terms of Service', tokusho: 'Specified Commercial Transactions Act (Japanese)', contact: 'Contact',
    operator: 'Operated by: Hirayama Properties K.K.',
    tm: 'Google Play and the Google Play logo are trademarks of Google LLC. App Store is a service mark of Apple Inc.',
    site: 'HOLD THE BULWARK Official Site',
  },
};

// [lang, slug, source file]
const PAGES = [
  ['ja', 'privacy', 'ja-privacy.md'],
  ['ja', 'terms', 'ja-terms.md'],
  ['ja', 'tokusho', 'ja-tokusho.md'],
  ['en', 'privacy', 'en-privacy.md'],
  ['en', 'terms', 'en-terms.md'],
];
const has = (lang, slug) => PAGES.some(([l, s]) => l === lang && s === slug);
const urlOf = (lang, slug) => SITE_URL + (lang === 'en' ? 'en/' : '') + slug + '/';

for (const [lang, slug, file] of PAGES) {
  const raw = fs.readFileSync(path.join(HERE, 'legal', file), 'utf8');
  const [head, body] = raw.split(/\n---\n/);
  const title = head.match(/^title: (.+)$/m)[1];
  const t = T[lang];
  const root = lang === 'ja' ? '../' : '../../';          // to site root
  const home = lang === 'ja' ? '../' : '../';             // to this language's top page
  const link = (l, s) => {                                 // relative link from this page to another legal page
    const target = has(l, s) ? (l === 'en' ? 'en/' : '') + s + '/' : (s === 'tokusho' ? 'tokusho/' : (l === 'en' ? 'en/' : ''));
    return root + target;
  };
  const other = lang === 'ja' ? 'en' : 'ja';
  const otherHref = has(other, slug) ? link(other, slug) : root + (other === 'en' ? 'en/' : '');
  const alt = has(other, slug)
    ? `<link rel="alternate" hreflang="${lang}" href="${urlOf(lang, slug)}">\n<link rel="alternate" hreflang="${other}" href="${urlOf(other, slug)}">\n`
    : '';
  const page = `<!doctype html>
<html lang="${lang}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}｜HOLD THE BULWARK</title>
<meta name="description" content="${esc(`${title} — HOLD THE BULWARK: The Undead Legion`)}">
<meta name="theme-color" content="#0E1015">
<link rel="canonical" href="${urlOf(lang, slug)}">
${alt}<link rel="icon" href="${root}favicon.ico" sizes="32x32">
<link rel="apple-touch-icon" href="${root}assets/img/apple-touch-icon.png">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="${esc(FONT)}">
<link rel="stylesheet" href="${root}assets/css/style.css">
<link rel="stylesheet" href="${root}assets/css/legal.css">
</head>
<body>
<div class="root lang-${lang}" lang="${lang}">
<header class="legal-header">
<div class="wrap legal-header-in">
<a href="${home}" class="legal-logo">
<img src="${root}assets/img/app-icon.webp" alt="" width="36" height="36">
<span>HOLD THE <span class="accent">BULWARK</span></span>
</a>
<div role="group" aria-label="Language" class="legal-lang">
<a class="lang-btn${lang === 'ja' ? ' on' : ''}" href="${lang === 'ja' ? './' : otherHref}" hreflang="ja" lang="ja"${lang === 'ja' ? ' aria-current="page"' : ''}>日本語</a>
<a class="lang-btn${lang === 'en' ? ' on' : ''}" href="${lang === 'en' ? './' : otherHref}" hreflang="en" lang="en"${lang === 'en' ? ' aria-current="page"' : ''}>EN</a>
</div>
</div>
</header>
<main class="wrap legal-main">
<p class="legal-back"><a href="${home}">← ${t.home}</a></p>
<p class="eyebrow">HOLD THE BULWARK: The Undead Legion</p>
<h1 class="disp legal-title">${esc(title)}</h1>
<article class="legal-body">
${md(body)}
</article>
</main>
<footer class="legal-footer">
<div class="wrap">
<nav aria-label="Footer" class="legal-footer-nav">
<a href="${link(lang, 'privacy')}"${slug === 'privacy' ? ' aria-current="page"' : ''}>${t.privacy}</a>
<a href="${link(lang, 'terms')}"${slug === 'terms' ? ' aria-current="page"' : ''}>${t.terms}</a>
<a href="${root}tokusho/"${slug === 'tokusho' ? ' aria-current="page"' : ''}>${t.tokusho}</a>
<a href="https://forms.gle/QtNSUzpAxisWaQEp6" target="_blank" rel="noopener">${t.contact}</a>
<a href="${home}">${t.site}</a>
</nav>
<p>${t.operator}</p>
<p>${t.tm}</p>
<p>© 2026 Hirayama Properties K.K.</p>
</div>
</footer>
</div>
</body>
</html>
`;
  const dir = path.join(OUT, lang === 'en' ? 'en' : '', slug);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'index.html'), page);
}

fs.writeFileSync(path.join(OUT, 'assets/css/legal.css'), `/* legal pages */
.root{background:#0E1015;color:#EDE6D6;font-family:'Noto Sans JP',system-ui,sans-serif;font-size:16px;line-height:1.7;min-height:100vh;overflow-x:clip}
.legal-title{color:#F4EEE1}
.legal-header{position:sticky;top:0;z-index:30;background:rgba(14,16,21,.92);backdrop-filter:blur(10px);border-bottom:1px solid #1F232C}
.legal-header-in{height:64px;display:flex;align-items:center;justify-content:space-between;gap:16px}
.legal-logo{font-family:'Cinzel',serif;display:flex;align-items:center;gap:10px;white-space:nowrap;min-width:0;text-decoration:none;color:#EDE6D6;font-weight:900;font-size:16px;letter-spacing:.06em}
.legal-logo:hover{color:#EDE6D6}
.legal-logo img{width:36px;height:36px;border-radius:9px;border:1px solid #3A3F4B}
.legal-logo .accent{color:#FF7A1A}
.legal-lang{display:flex;padding:4px;border:1px solid #2E333E;border-radius:999px}
.legal-main{max-width:820px;padding-top:40px;padding-bottom:80px}
.legal-back{margin:0 0 28px;font-size:14px}
.legal-back a{text-decoration:none}
.legal-title{font-size:clamp(28px,4.4vw,40px);margin-bottom:28px}
.legal-body{color:#D9D2C3;font-size:15.5px;line-height:1.95;overflow-wrap:anywhere}
.legal-body h2{font-size:19px;font-weight:700;color:#F4EEE1;margin:44px 0 12px;padding-bottom:10px;border-bottom:1px solid #262B36}
.legal-body h3{font-size:16px;font-weight:700;color:#FF9A4D;margin:24px 0 6px}
.legal-body p{margin:0 0 14px}
.legal-body ul,.legal-body ol{margin:0 0 16px;padding-left:1.4em}
.legal-body li{margin:4px 0}
.legal-updated{color:#A9A398;font-size:13.5px}
.legal-table{width:100%;border-collapse:collapse;border-top:1px solid #262B36}
.legal-table th,.legal-table td{text-align:left;vertical-align:top;padding:16px 12px;border-bottom:1px solid #262B36}
.legal-table th{width:32%;color:#F4EEE1;font-weight:700;background:#151922}
@media (max-width:600px){.legal-table th,.legal-table td{display:block;width:auto}.legal-table th{border-bottom:0;padding-bottom:6px}.legal-table td{padding-top:6px}.legal-logo{font-size:13px;letter-spacing:.03em}.legal-logo img{width:32px;height:32px}}
.legal-footer{background:#1B1F27;padding:32px 0 48px;color:#BDB6A8;font-size:13px;line-height:1.7}
.legal-footer p{margin:4px 0}
.legal-footer-nav{display:flex;flex-wrap:wrap;gap:4px 24px;margin-bottom:16px}
.legal-footer-nav a{color:#EDE6D6;padding:10px 0}
.legal-footer-nav a[aria-current]{color:#FF9A4D}
`);
console.log('legal pages:', PAGES.map(([l, s]) => (l === 'en' ? 'en/' : '') + s).join(', '));
