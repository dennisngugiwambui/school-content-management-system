/**
 * Keeps the CMS data in a branch of the GitHub repository, so it survives hosts whose disk is wiped
 * on restart (such as Render's free plan) and so GitHub Actions can rebuild the Pages site from it.
 *
 * The branch holds the database, encrypted with BACKUP_KEY (it contains password hashes and the
 * login secret), plus the uploaded files, which are public on the website anyway.
 * Enabled when GITHUB_TOKEN, GITHUB_REPO and BACKUP_KEY are all set.
 */
import crypto from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { DATA_DIR, UPLOAD_DIR } from '../config.js';

const TOKEN = process.env.GITHUB_TOKEN || '';
// GITHUB_REPOSITORY is set automatically inside GitHub Actions.
const REPO = process.env.GITHUB_REPO || process.env.GITHUB_REPOSITORY || '';
const KEY = process.env.BACKUP_KEY || '';
export const BACKUP_BRANCH = process.env.BACKUP_BRANCH || 'cms-data';
export const BACKUP_ON = Boolean(TOKEN && REPO && KEY);

const DB_PATH = path.join(DATA_DIR, 'school.db');
const DB_FILE = 'school.db.enc';

async function gh(method, url, body) {
  const res = await fetch(`https://api.github.com/repos/${REPO}${url}`, {
    method,
    headers: {
      Authorization: `Bearer ${TOKEN}`,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      ...(body && { 'Content-Type': 'application/json' }),
    },
    body: body && JSON.stringify(body),
  });
  if (method === 'GET' && res.status === 404) return null;
  if (!res.ok) throw new Error(`GitHub ${method} ${url} failed (${res.status}): ${(await res.text()).slice(0, 200)}`);
  return res.json();
}

const cipherKey = () => crypto.scryptSync(KEY, 'school-cms-backup', 32);

function encrypt(data) {
  const iv = crypto.randomBytes(12);
  const c = crypto.createCipheriv('aes-256-gcm', cipherKey(), iv);
  const body = Buffer.concat([c.update(data), c.final()]);
  return Buffer.concat([iv, c.getAuthTag(), body]);
}

function decrypt(data) {
  const d = crypto.createDecipheriv('aes-256-gcm', cipherKey(), data.subarray(0, 12));
  d.setAuthTag(data.subarray(12, 28));
  return Buffer.concat([d.update(data.subarray(28)), d.final()]);
}

/** The SHA git gives a file, so unchanged files are not uploaded again. */
const blobSha = (data) => crypto.createHash('sha1').update(`blob ${data.length}\0`).update(data).digest('hex');

async function remoteFiles() {
  const ref = await gh('GET', `/git/ref/heads/${BACKUP_BRANCH}`);
  if (!ref) return null;
  const tree = await gh('GET', `/git/trees/${ref.object.sha}?recursive=1`);
  return { commit: ref.object.sha, files: new Map(tree.tree.filter((t) => t.type === 'blob').map((t) => [t.path, t.sha])) };
}

function localUploads(dir = UPLOAD_DIR) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const full = path.join(dir, e.name);
    return e.isDirectory() ? localUploads(full) : e.isFile() ? [full] : [];
  });
}

/**
 * On a fresh disk, downloads the database and any missing uploads from the backup branch.
 * Throws if the backup cannot be read, so the server never starts empty and then overwrites a good backup.
 */
export async function restoreBackup() {
  if (!BACKUP_ON) return;
  const remote = await remoteFiles();
  if (!remote) return console.log(`  No backup in the "${BACKUP_BRANCH}" branch yet; starting with local data.`);

  const fetchBlob = async (sha) => Buffer.from((await gh('GET', `/git/blobs/${sha}`)).content, 'base64');
  let files = 0;
  for (const [name, sha] of remote.files) {
    if (name === DB_FILE) {
      if (fs.existsSync(DB_PATH)) continue;
      fs.mkdirSync(DATA_DIR, { recursive: true });
      fs.writeFileSync(DB_PATH, decrypt(await fetchBlob(sha)));
      console.log('  Restored the database from the backup.');
    } else if (name.startsWith('uploads/')) {
      const file = path.resolve(UPLOAD_DIR, name.slice('uploads/'.length));
      if (!file.startsWith(path.resolve(UPLOAD_DIR) + path.sep) || fs.existsSync(file)) continue;
      fs.mkdirSync(path.dirname(file), { recursive: true });
      fs.writeFileSync(file, await fetchBlob(sha));
      files++;
    }
  }
  if (files) console.log(`  Restored ${files} uploaded files from the backup.`);
}

async function pushBackup() {
  // A consistent copy of the live database, taken through a separate connection.
  const tmp = path.join(os.tmpdir(), `school-cms-backup-${process.pid}.db`);
  fs.rmSync(tmp, { force: true });
  const src = new DatabaseSync(DB_PATH);
  try {
    src.exec(`VACUUM INTO '${tmp.replaceAll("'", "''")}'`);
  } finally {
    src.close();
  }
  const dbData = encrypt(fs.readFileSync(tmp));
  fs.rmSync(tmp, { force: true });

  const remote = await remoteFiles();
  const entries = [{ path: DB_FILE, data: dbData }].concat(
    localUploads().map((f) => ({ path: 'uploads/' + path.relative(UPLOAD_DIR, f).split(path.sep).join('/'), file: f }))
  );

  // Listing every file (no base tree) means files deleted here are removed from the backup too.
  const tree = [];
  for (const e of entries) {
    const data = e.data ?? fs.readFileSync(e.file);
    let sha = blobSha(data);
    if (remote?.files.get(e.path) !== sha) {
      sha = (await gh('POST', '/git/blobs', { content: data.toString('base64'), encoding: 'base64' })).sha;
    }
    tree.push({ path: e.path, mode: '100644', type: 'blob', sha });
  }
  const { sha: treeSha } = await gh('POST', '/git/trees', { tree });
  const commit = await gh('POST', '/git/commits', {
    message: `Website content update ${new Date().toISOString()}`,
    tree: treeSha,
    parents: remote ? [remote.commit] : [],
  });
  if (remote) await gh('PATCH', `/git/refs/heads/${BACKUP_BRANCH}`, { sha: commit.sha });
  else await gh('POST', '/git/refs', { ref: `refs/heads/${BACKUP_BRANCH}`, sha: commit.sha });
  console.log(`  Content backed up to the "${BACKUP_BRANCH}" branch (${entries.length} files).`);
}

let timer = null;
let running = null;
let again = false;

/** Saves a backup now; a request made while one is running queues exactly one more. */
export function runBackup() {
  if (running) {
    again = true;
    return running;
  }
  running = (async () => {
    try {
      do {
        again = false;
        await pushBackup();
      } while (again);
    } finally {
      running = null;
    }
  })();
  return running;
}

/** Backs up shortly after the last change, so a burst of edits makes one commit. */
export function scheduleBackup(delayMs = 10_000) {
  if (!BACKUP_ON) return;
  clearTimeout(timer);
  timer = setTimeout(() => {
    timer = null;
    runBackup().catch((err) => console.error('Backup failed:', err.message));
  }, delayMs);
}

/** Saves any pending changes before the server stops. */
export async function flushBackup() {
  if (timer) {
    clearTimeout(timer);
    timer = null;
    await runBackup();
  } else if (running) await running;
}
