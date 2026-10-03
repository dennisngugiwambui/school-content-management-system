/**
 * Builds the public website as static files for GitHub Pages.
 *
 *   npm run pages:build     → client/dist-pages (preview with: npm run pages:preview)
 *   npm run pages:deploy    → builds, then publishes to the gh-pages branch
 *
 * GitHub Pages cannot run the Node server, so this script starts the API briefly,
 * saves every public response as JSON (plus album / fee ZIPs), and copies the
 * uploaded photos next to the built site. The admin panel stays on the Node server:
 * edit content there, then run the deploy again to refresh the Pages site.
 *
 * Options (environment variables):
 *   PAGES_BASE      URL path the site is served from, e.g. /school-website/ (default: from the git remote)
 *   VITE_ADMIN_URL  Address of the full CMS server, linked from the Portal page (optional)
 *   DATA_DIR        Database folder to export from (default: server/data)
 */
import { spawn, spawnSync, execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CLIENT = path.join(ROOT, 'client');
const SERVER = path.join(ROOT, 'server');
const OUT = path.join(CLIENT, 'dist-pages');
const PORT = 5199;
const API = `http://127.0.0.1:${PORT}/api/public`;

// Same mapping as staticName() in client/src/lib/api.js.
const staticName = (p) => p.replace(/^\/public\//, '').replace(/[^\w-]+/g, '_');

function pagesBase() {
  if (process.env.PAGES_BASE) return `/${process.env.PAGES_BASE.replace(/^\/|\/$/g, '')}/`.replace('//', '/');
  try {
    const remote = execSync('git remote get-url origin', { cwd: ROOT, stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim();
    const repo = remote.replace(/\.git$/, '').split(/[/:]/).pop();
    // A repository named <user>.github.io is served from the domain root.
    return /\.github\.io$/i.test(repo) ? '/' : `/${repo}/`;
  } catch {
    return '/';
  }
}

const step = (msg) => console.log(`\n▸ ${msg}`);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const base = pagesBase();
step(`Building the website for ${base}`);
fs.rmSync(OUT, { recursive: true, force: true });
const build = spawnSync(process.execPath, [path.join(CLIENT, 'node_modules', 'vite', 'bin', 'vite.js'), 'build'], {
  cwd: CLIENT,
  stdio: 'inherit',
  env: { ...process.env, VITE_STATIC: 'true', VITE_BASE: base, VITE_OUT_DIR: 'dist-pages' },
});
if (build.status !== 0) process.exit(build.status ?? 1);

step('Starting the API to export content');
const server = spawn(process.execPath, ['--disable-warning=ExperimentalWarning', 'src/index.js'], {
  cwd: SERVER,
  env: { ...process.env, PORT: String(PORT), NODE_ENV: 'development' },
  stdio: ['ignore', 'ignore', 'inherit'],
});
const stop = () => server.kill();
process.on('exit', stop);

try {
  let ready = false;
  // Up to 2 minutes: on a fresh checkout the server first restores content from the GitHub backup.
  for (let i = 0; i < 240 && !ready; i++) {
    ready = await fetch(`${API}/site`).then((r) => r.ok).catch(() => false);
    if (!ready) await sleep(500);
  }
  if (!ready) throw new Error('The API did not start. Is the server installed (npm install in server/)?');

  const dataDir = path.join(OUT, 'data');
  fs.mkdirSync(dataDir, { recursive: true });
  const save = async (p, binary = false) => {
    const res = await fetch(`http://127.0.0.1:${PORT}/api${p}`);
    if (!res.ok) return null;
    const file = path.join(dataDir, `${staticName(p)}.${binary ? 'zip' : 'json'}`);
    if (binary) fs.writeFileSync(file, Buffer.from(await res.arrayBuffer()));
    else {
      const json = await res.json();
      fs.writeFileSync(file, JSON.stringify(json));
      return json;
    }
    return true;
  };

  step('Exporting content');
  const site = await save('/public/site');
  if (!site?.installed) throw new Error('The school has not been set up yet. Run the site once and finish the setup wizard.');
  const portal = site.content?.pages?.portal ?? {};
  if (!process.env.VITE_ADMIN_URL && !process.env.VITE_SCHOOL_PORTAL_URL && !portal.erpUrl) {
    console.warn('  ⚠ No sign-in address is set, so the Portal button is hidden on this site.\n'
      + '    Set Admin → Page Banners & Menu → Portal → School portal address, or VITE_SCHOOL_PORTAL_URL / VITE_ADMIN_URL.');
  }
  for (const p of ['/public/home', '/public/gallery', '/public/staff', '/public/prefects', '/public/news?category=news', '/public/news?category=event', '/public/tenders']) await save(p);
  const departments = (await save('/public/departments')) ?? [];
  for (const d of departments) await save(`/public/departments/${d.slug}`);
  const news = (await save('/public/news')) ?? [];
  for (const n of news) await save(`/public/news/${n.slug}`);
  const albums = (await save('/public/albums')) ?? [];
  let zips = 0;
  for (const a of albums) if (await save(`/public/albums/${a.id}/download`, true)) zips++;
  if (await save('/public/fees/download', true)) zips++;
  console.log(`  ${departments.length} departments, ${news.length} news & events, ${albums.length} albums, ${zips} download ZIPs`);

  step('Copying uploaded photos');
  const uploads = path.resolve(SERVER, process.env.UPLOAD_DIR || 'uploads');
  if (fs.existsSync(uploads)) fs.cpSync(uploads, path.join(OUT, 'uploads'), { recursive: true });

  // GitHub Pages serves 404.html for unknown paths, which lets the app handle deep links like /about.
  fs.copyFileSync(path.join(OUT, 'index.html'), path.join(OUT, '404.html'));
  fs.writeFileSync(path.join(OUT, '.nojekyll'), '');
  step(`Done: ${path.relative(ROOT, OUT)} is ready to publish.`);
} catch (err) {
  console.error(`\n✖ ${err.message}`);
  process.exitCode = 1;
} finally {
  stop();
}
