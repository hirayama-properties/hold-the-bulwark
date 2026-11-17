// Appends ?v=<hash of file> to style.css / legal.css / main.js references so browsers never use a stale cached copy.
import fs from 'node:fs'; import path from 'node:path'; import crypto from 'node:crypto';
const OUT = process.argv[2];
const files = ['assets/css/style.css', 'assets/css/legal.css', 'assets/js/main.js'];
const ver = Object.fromEntries(files.map((f) => [f, crypto.createHash('sha1').update(fs.readFileSync(path.join(OUT, f))).digest('hex').slice(0, 8)]));
const walk = (d) => fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => e.isDirectory() ? (e.name === '.git' ? [] : walk(path.join(d, e.name))) : [path.join(d, e.name)]);
for (const f of walk(OUT).filter((f) => f.endsWith('.html'))) {
  let h = fs.readFileSync(f, 'utf8');
  for (const [asset, v] of Object.entries(ver)) h = h.replace(new RegExp('(' + asset.replace(/[.]/g, '\\.') + ')(\\?v=[0-9a-f]+)?"', 'g'), `$1?v=${v}"`);
  fs.writeFileSync(f, h);
}
console.log('versioned', ver);
