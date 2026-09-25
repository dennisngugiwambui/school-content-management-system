/** Serves client/dist-pages the way GitHub Pages will: under its base path, with 404.html for deep links. */
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const OUT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'client', 'dist-pages');
if (!fs.existsSync(OUT)) { console.error('Run "npm run pages:build" first.'); process.exit(1); }
const html = fs.readFileSync(path.join(OUT, 'index.html'), 'utf8');
const base = (html.match(/src="(\/[^"]*?)assets\//) || [, '/'])[1];
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.gif': 'image/gif', '.ico': 'image/x-icon', '.woff2': 'font/woff2', '.woff': 'font/woff', '.zip': 'application/zip' };
const PORT = Number(process.env.PORT) || 4173;

http.createServer((req, res) => {
  const url = decodeURIComponent(req.url.split('?')[0]);
  if (!url.startsWith(base)) { res.writeHead(302, { Location: base }); return res.end(); }
  const file = path.join(OUT, url.slice(base.length));
  if (file.startsWith(OUT) && fs.existsSync(file) && fs.statSync(file).isFile()) {
    res.writeHead(200, { 'Content-Type': TYPES[path.extname(file).toLowerCase()] || 'application/octet-stream' });
    return fs.createReadStream(file).pipe(res);
  }
  res.writeHead(404, { 'Content-Type': 'text/html' });
  res.end(fs.readFileSync(path.join(OUT, '404.html')));
}).listen(PORT, () => console.log(`GitHub Pages preview: http://localhost:${PORT}${base}`));
