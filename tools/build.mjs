// Converts the canvas design (Main.dc.html) into a static two-language site.
// usage: node tools/build.mjs <design/Main.dc.html> <assetsDir|-> <outDir> <siteUrl>
// assetsDir '-' = images already live in <outDir>/assets/img (the normal case in this repo)
import fs from 'node:fs';
import path from 'node:path';

const [, , SRC, ASSETS, OUT, SITE_URL_IN] = process.argv;
const SITE_URL = (SITE_URL_IN || 'https://example.com/').replace(/\/?$/, '/');
const src = fs.readFileSync(SRC, 'utf8');

// ---------- assets: blob id -> file ----------
const BLOBS = {
  '16368b401b0606ae1f154464a5e75dcf': 'app-icon.webp',
  '06c749a0e43ad929ed1f3b5a593b4b2f': 'key-visual-2.webp',
  'c6de04a8578658fab3697fcffc735168': 'icon-wide-bomb.webp',
  '4b557c12f919673cabff0394ad303a45': 'icon-power-bomb.webp',
  '0962bdc3a168a05f4430bbd64a9e956c': 'icon-piercing.webp',
  'b808d4958de84509f21128a95213e477': 'icon-potion-hp.webp',
  'ee0c4391cae6d9ea5af0a5dc25ac560a': 'icon-potion-max.webp',
  '5168dce26d2aaee5884790f339b566ab': 'shot-title.webp',
  'fca2177f3c348520bd05432c35802c1e': 'shot-s04.webp',
  '6cca9c343f630e978cf7ee0af44eb13e': 'shot-s07.webp',
  '19af075a8164460c0fe803d424830bbc': 'shot-s06.webp',
  '36de4244cb9e7155203c8daf32393398': 'shot-s10.webp',
  '8d7723770b0710bb3f691aa58ce39c6f': 'shot-s11.webp',
  'ae1b5d49c90ff9e91cedb24f080ff5e4': 'shot-s12.webp',
  '4d467249047238c6edd0ef7de1f37f68': 'shot-s17.webp',
  '0ad8ed20304eb4b2882251406314b76b': 'shot-shop.webp',
  'edb391c0a81c72c3195ed4af873655e9': 'shot-settings.webp',
  '0c85567450aeed5c3b7550bac9d9ee64': 'kv-enemy-infantry.webp',
  '8bbc84861dd5b038a460e7b58f8deaf2': 'kv-enemy-cavalry.webp',
  '3fde7dcdfcc0f976018cb225d643d6eb': 'kv-enemy-giant.webp',
  '6e8b60a8bc104a9f4231d0e3cba58dca': 'kv-enemy-boss.webp',
};
const RENAME = { 'key-visual-2.webp': 'key-visual.webp' };
const outName = (f) => RENAME[f] || f;

// ---------- pieces of the source ----------
const style = src.match(/<style>([\s\S]*?)<\/style>/)[1].trim();
const fontLink = src.match(/<link href="(https:\/\/fonts\.googleapis\.com\/css2[^"]+)"/)[1];
let body = src.match(/<\/helmet>([\s\S]*?)<\/x-dc>/)[1].trim();
const script = src.match(/data-dc-script[^>]*>([\s\S]*?)<\/script>/)[1];

// Evaluate the component class to read its texts and constants.
const Component = new Function(`class DCLogic { constructor(p){ this.props = p || {}; this.state = {}; } setState(){} }\n${script}\nreturn Component;`)();
const comp = new Component({});
const TEXTS = comp.texts();
const pick = (re) => { const m = script.match(re); if (!m) throw new Error('missing ' + re); return m[1]; };
const PLAY_URL = pick(/PLAY_URL = '([^']+)'/);
const APP_STORE_URL = pick(/APP_STORE_URL = '([^']*)'/);
const CONTACT_URL = pick(/CONTACT_URL = '([^']+)'/);
const LEGAL = new Function(`return ${pick(/var LEGAL = (\{[\s\S]*?\n    \});/)}`)();
const SHOT_BLOBS = [...pick(/var SHOTS = \[([\s\S]*?)\];/).matchAll(/\/_blob\/([0-9a-f]+)/g)].map((m) => m[1]);

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

function build(lang) {
  const t = TEXTS[lang];
  const base = lang === 'ja' ? '' : '../';
  const A = (f) => `${base}assets/img/${outName(f)}`;
  const shots = SHOT_BLOBS.map((id, i) => ({ n: i + 1, src: A(BLOBS[id]), alt: t.shotAlts[i] }));
  let h = body;

  // sc-for: embers and screenshots
  h = h.replace(/<sc-for list="\{\{emberList\}\}"[^>]*>([\s\S]*?)<\/sc-for>/g, (_, inner) => inner.trim().repeat(16));
  h = h.replace(/<sc-for list="\{\{shots\}\}"[^>]*>([\s\S]*?)<\/sc-for>/, (_, tpl) =>
    shots.map((s) => tpl
      .replace('onClick="{{s.open}}"', `data-shot="${s.n}"`)
      .replace('{{s.src}}', s.src)
      .replace('{{s.alt}}', esc(s.alt))
      .replace('{{s.aria}}', esc(`${t.enlarge} ${s.n}`))
      .replace('{{s.num}}', String(s.n).padStart(2, '0'))
    ).join(''));

  // sc-if, innermost first
  const addAttr = (inner, attrs) => inner.replace(/^(\s*<[a-zA-Z]+)/, `$1 ${attrs}`);
  const ifRe = /<sc-if value="\{\{(\w+)\}\}"[^>]*>((?:(?!<sc-if)[\s\S])*?)<\/sc-if>/;
  let m;
  while ((m = h.match(ifRe))) {
    const [all, key, inner] = m;
    const map = {
      showEmbers: inner,
      ctaLive: addAttr(inner, 'data-cta="live"'),
      ctaOff: addAttr(inner, 'data-cta="off" hidden'),
      menuOpen: addAttr(inner, 'id="mobile-menu" hidden'),
      zoomOpen: addAttr(inner, 'id="lightbox" hidden'),
    };
    if (!(key in map)) throw new Error('unhandled sc-if ' + key);
    h = h.replace(all, map[key]);
  }

  // language switch: buttons -> links to the other page
  h = h.replace(/<button type="button" class="\{\{jaCls\}\}"[^>]*>([^<]*)<\/button>/,
    `<a class="lang-btn${lang === 'ja' ? ' on' : ''}" href="${lang === 'ja' ? './' : '../'}" hreflang="ja" lang="ja" data-lang="ja"${lang === 'ja' ? ' aria-current="page"' : ''}>$1</a>`);
  h = h.replace(/<button type="button" class="\{\{enCls\}\}"[^>]*>([^<]*)<\/button>/,
    `<a class="lang-btn${lang === 'en' ? ' on' : ''}" href="${lang === 'ja' ? 'en/' : './'}" hreflang="en" lang="en" data-lang="en"${lang === 'en' ? ' aria-current="page"' : ''}>$1</a>`);

  // events -> data-action hooks for main.js
  h = h.replace(/onClick="\{\{toggleMenu\}\}"/g, 'data-action="menu" aria-controls="mobile-menu"')
    .replace(/ onClick="\{\{closeMenu\}\}"/g, ' data-action="close-menu"')
    .replace(/onClick="\{\{zoomPrev\}\}"/g, 'data-action="zoom-prev"')
    .replace(/onClick="\{\{zoomNext\}\}"/g, 'data-action="zoom-next"')
    .replace(/onClick="\{\{zoomClose\}\}"/g, 'data-action="zoom-close"');
  h = h.replace('<img src="{{zoomSrc}}" alt="{{zoomAlt}}"', '<img id="lightbox-img" src="" alt=""');

  const vals = {
    lang, langCls: 'lang-' + lang, menuExpanded: 'false',
    playUrl: PLAY_URL, ctaUrl: PLAY_URL, ctaText: esc(t.cta),
    // legal pages live on this site (see legal.mjs); English has no tokusho page
    privacyUrl: 'privacy/', termsUrl: 'terms/', tokushoUrl: lang === 'ja' ? 'tokusho/' : '../tokusho/',
    zoomLabel: 'SCREENSHOT', contactUrl: CONTACT_URL,
  };
  h = h.replace(/(href="\{\{(?:privacyUrl|termsUrl|tokushoUrl)\}\}") target="_blank" rel="noopener"/g, '$1');
  h = h.replace(/\{\{t\.(\w+)\}\}/g, (_, k) => { if (!(k in t)) throw new Error('missing text ' + k); return esc(t[k]); });
  h = h.replace(/\{\{(\w+)\}\}/g, (_, k) => { if (!(k in vals)) throw new Error('missing val ' + k); return vals[k]; });
  h = h.replace(/\/_blob\/([0-9a-f]{32})/g, (_, id) => { if (!BLOBS[id]) throw new Error('unknown blob ' + id); return A(BLOBS[id]); });
  h = h.replace(/<!-- =+ ([A-Z &]+) =+ -->/g, '<!-- $1 -->');
  if (/\{\{|sc-if|sc-for|onClick/.test(h)) throw new Error('leftover template syntax in ' + lang);

  const pageUrl = SITE_URL + (lang === 'ja' ? '' : 'en/');
  const desc = lang === 'ja'
    ? 'マージ×ライン防衛アクション「HOLD THE BULWARK: The Undead Legion」公式サイト。味方を合体させて強化し、迫りくるアンデッド軍団から全30ステージ、防衛ラインを守り抜こう。基本プレイ無料。'
    : 'Official site of HOLD THE BULWARK: The Undead Legion, a merge × lane defense game. Merge your allies, hold the line, and crush the undead legion across 30 stages. Free to play.';
  const title = lang === 'ja'
    ? 'HOLD THE BULWARK: The Undead Legion｜公式サイト'
    : 'HOLD THE BULWARK: The Undead Legion | Official Site';
  const ld = {
    '@context': 'https://schema.org',
    '@type': ['VideoGame', 'MobileApplication'],
    name: 'HOLD THE BULWARK: The Undead Legion',
    url: pageUrl,
    description: desc,
    image: SITE_URL + 'assets/img/ogp.jpg',
    applicationCategory: 'GameApplication',
    genre: ['Merge', 'Tower Defense'],
    operatingSystem: 'Android',
    gamePlatform: 'Android',
    inLanguage: ['ja', 'en'],
    installUrl: PLAY_URL,
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'JPY' },
    publisher: { '@type': 'Organization', name: 'Hirayama Properties K.K.' },
  };

  return `<!doctype html>
<html lang="${lang}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${esc(desc)}">
<meta name="theme-color" content="#0E1015">
<link rel="canonical" href="${pageUrl}">
<link rel="alternate" hreflang="ja" href="${SITE_URL}">
<link rel="alternate" hreflang="en" href="${SITE_URL}en/">
<link rel="alternate" hreflang="x-default" href="${SITE_URL}">
<meta property="og:type" content="website">
<meta property="og:site_name" content="HOLD THE BULWARK">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(desc)}">
<meta property="og:url" content="${pageUrl}">
<meta property="og:image" content="${SITE_URL}assets/img/ogp.jpg">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:locale" content="${lang === 'ja' ? 'ja_JP' : 'en_US'}">
<meta property="og:locale:alternate" content="${lang === 'ja' ? 'en_US' : 'ja_JP'}">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${esc(title)}">
<meta name="twitter:description" content="${esc(desc)}">
<meta name="twitter:image" content="${SITE_URL}assets/img/ogp.jpg">
<link rel="icon" href="${base}favicon.ico" sizes="32x32">
<link rel="icon" href="${base}assets/img/icon-192.png" type="image/png" sizes="192x192">
<link rel="apple-touch-icon" href="${base}assets/img/apple-touch-icon.png">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="${fontLink.replace(/&amp;/g, '&amp;')}">
<link rel="preload" as="image" href="${A('key-visual-2.webp')}" fetchpriority="high">
<link rel="stylesheet" href="${base}assets/css/style.css">
<script type="application/ld+json">${JSON.stringify(ld)}</script>
<script src="${base}assets/js/main.js" defer></script>
</head>
<body>
${h}
<script>window.BULWARK = ${JSON.stringify({ lang, appStoreUrl: APP_STORE_URL, ctaIos: t.ctaIos, prev: t.prev, next: t.next })};</script>
</body>
</html>
`;
}

// ---------- write ----------
fs.mkdirSync(path.join(OUT, 'en'), { recursive: true });
fs.mkdirSync(path.join(OUT, 'assets/css'), { recursive: true });
fs.mkdirSync(path.join(OUT, 'assets/js'), { recursive: true });
fs.mkdirSync(path.join(OUT, 'assets/img'), { recursive: true });
fs.writeFileSync(path.join(OUT, 'index.html'), build('ja'));
fs.writeFileSync(path.join(OUT, 'en/index.html'), build('en'));
const extraCss = `
/* static-site additions */
[hidden]{display:none!important}
.lang-btn{display:inline-flex;align-items:center;justify-content:center;padding:0 10px;text-decoration:none}
.lang-btn:hover{color:#EDE6D6}
.lang-btn.on:hover{color:#14161C}
#lightbox img{user-select:none}
body.no-scroll{overflow:hidden}
`;
fs.writeFileSync(path.join(OUT, 'assets/css/style.css'), style.replace(/\n/g, '\n') + '\n' + extraCss);
if (ASSETS && ASSETS !== '-') for (const f of new Set(Object.values(BLOBS))) fs.copyFileSync(path.join(ASSETS, f), path.join(OUT, 'assets/img', outName(f)));
console.log('built', OUT, 'site:', SITE_URL, 'shots:', SHOT_BLOBS.length);
