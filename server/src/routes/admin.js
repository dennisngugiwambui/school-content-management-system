import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { db, tx, getSettings, getContent, setKV } from '../db.js';
import { DEFAULT_SETTINGS, DEFAULT_CONTENT } from '../defaults.js';
import { requireAuth, requireRole, publicUser, endUserSessions } from '../lib/auth.js';
import { upload, uploadDocument, verifyDocument, fileUrl } from '../lib/upload.js';
import { HttpError, isEmail, isPlainObject } from '../lib/utils.js';
import { RESOURCES, sanitize, listResource, getRow, insertRow, updateRow } from '../resources.js';

const router = Router();
router.use(requireAuth);

const pick = (obj, keys) => Object.fromEntries(keys.filter((k) => k in obj).map((k) => [k, obj[k]]));

/* ----------------------------- Dashboard ----------------------------- */

router.get('/stats', (req, res) => {
  const count = (sql) => db.prepare(sql).get().n;
  res.json({
    departments: count('SELECT COUNT(*) AS n FROM departments'),
    staff: count('SELECT COUNT(*) AS n FROM staff'),
    prefects: count('SELECT COUNT(*) AS n FROM prefects'),
    albums: count('SELECT COUNT(*) AS n FROM albums'),
    images: count('SELECT COUNT(*) AS n FROM images'),
    news: count('SELECT COUNT(*) AS n FROM news'),
    tenders: count('SELECT COUNT(*) AS n FROM tenders'),
    users: count('SELECT COUNT(*) AS n FROM users'),
    recentNews: db.prepare('SELECT id, title, category, created_at, is_published FROM news ORDER BY created_at DESC LIMIT 5').all(),
    lastUpdated: db.prepare('SELECT key, updated_at FROM kv WHERE key NOT LIKE ? ORDER BY updated_at DESC LIMIT 1').get('secret:%') ?? null,
  });
});

/* --------------------------- Settings & content --------------------------- */

router.get('/settings', (req, res) => res.json(getSettings()));

router.put('/settings', requireRole('admin'), (req, res) => {
  if (!isPlainObject(req.body)) throw new HttpError(400, 'Invalid settings payload.');
  const next = pick(req.body, Object.keys(DEFAULT_SETTINGS));
  if (next.schoolName !== undefined && String(next.schoolName).trim().length < 3) {
    throw new HttpError(400, 'The school name must be at least 3 characters.');
  }
  setKV('settings', { ...getSettings(), ...next });
  res.json(getSettings());
});

router.get('/content/:key', (req, res) => {
  if (!(req.params.key in DEFAULT_CONTENT)) throw new HttpError(404, 'Unknown content section.');
  res.json(getContent(req.params.key));
});

router.put('/content/:key', (req, res) => {
  const { key } = req.params;
  if (!(key in DEFAULT_CONTENT)) throw new HttpError(404, 'Unknown content section.');
  if (!isPlainObject(req.body)) throw new HttpError(400, 'Invalid content payload.');
  if (key === 'tiers') {
    for (const group of ['staff', 'prefects']) {
      const list = req.body[group];
      if (!Array.isArray(list) || !list.length) throw new HttpError(400, `At least one ${group} level is required.`);
      const keys = list.map((t) => String(t.key || '').trim());
      if (keys.some((k) => !k)) throw new HttpError(400, 'Every level needs a key.');
      if (new Set(keys).size !== keys.length) throw new HttpError(400, 'Level keys must be unique.');
    }
  }
  setKV(`content:${key}`, req.body);
  res.json(getContent(key));
});

/* -------------------------------- Uploads -------------------------------- */

router.post('/upload', upload.array('files', 40), (req, res) => {
  if (!req.files?.length) throw new HttpError(400, 'No file received.');
  res.status(201).json({ files: req.files.map((f) => ({ url: fileUrl(f), name: f.originalname, size: f.size })) });
});

/** One document (tender PDF, form…); its contents are checked against the file type. */
router.post('/upload-document', uploadDocument.single('file'), (req, res) => {
  if (!req.file) throw new HttpError(400, 'No file received.');
  verifyDocument(req.file);
  res.status(201).json({ url: fileUrl(req.file), name: req.file.originalname, size: req.file.size });
});

/* -------------------------------- Users -------------------------------- */

const users = Router();
users.use(requireRole('admin'));

const USER_COLS = 'id, name, email, role, is_active, last_login, created_at';
const ROLES = ['admin', 'editor'];

function assertAdminRemains(excludeId) {
  const n = db.prepare("SELECT COUNT(*) AS n FROM users WHERE role = 'admin' AND is_active = 1 AND id != ?").get(excludeId).n;
  if (!n) throw new HttpError(400, 'There must always be at least one active administrator.');
}

users.get('/', (req, res) => res.json(db.prepare(`SELECT ${USER_COLS} FROM users ORDER BY created_at`).all()));

users.post('/', (req, res) => {
  const { name = '', email = '', password = '', role = 'editor', is_active = true } = req.body || {};
  if (!String(name).trim()) throw new HttpError(400, 'Name is required.');
  if (!isEmail(email)) throw new HttpError(400, 'Please enter a valid email address.');
  if (String(password).length < 8) throw new HttpError(400, 'Password must be at least 8 characters.');
  if (!ROLES.includes(role)) throw new HttpError(400, 'Invalid role.');
  if (db.prepare('SELECT id FROM users WHERE email = ?').get(String(email).toLowerCase())) throw new HttpError(409, 'A user with that email already exists.');
  const r = db
    .prepare('INSERT INTO users (name, email, password_hash, role, is_active) VALUES (?, ?, ?, ?, ?)')
    .run(String(name).trim(), String(email).trim().toLowerCase(), bcrypt.hashSync(String(password), 10), role, is_active ? 1 : 0);
  res.status(201).json(db.prepare(`SELECT ${USER_COLS} FROM users WHERE id = ?`).get(Number(r.lastInsertRowid)));
});

users.put('/:id', (req, res) => {
  const id = Number(req.params.id);
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(id);
  if (!user) throw new HttpError(404, 'User not found.');
  const b = req.body || {};
  const name = b.name !== undefined ? String(b.name).trim() : user.name;
  const email = b.email !== undefined ? String(b.email).trim().toLowerCase() : user.email;
  const role = b.role ?? user.role;
  const active = b.is_active !== undefined ? (b.is_active ? 1 : 0) : user.is_active;
  if (!name) throw new HttpError(400, 'Name is required.');
  if (!isEmail(email)) throw new HttpError(400, 'Please enter a valid email address.');
  if (!ROLES.includes(role)) throw new HttpError(400, 'Invalid role.');
  if (db.prepare('SELECT id FROM users WHERE email = ? AND id != ?').get(email, id)) throw new HttpError(409, 'A user with that email already exists.');
  if (user.role === 'admin' && (role !== 'admin' || !active)) assertAdminRemains(id);
  tx(() => {
    db.prepare('UPDATE users SET name = ?, email = ?, role = ?, is_active = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(name, email, role, active, id);
    if (b.password) {
      if (String(b.password).length < 8) throw new HttpError(400, 'Password must be at least 8 characters.');
      db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(bcrypt.hashSync(String(b.password), 10), id);
    }
  });
  // A reset password or a deactivated account signs that user out everywhere.
  if (b.password || !active) endUserSessions(id, id === req.user.id ? req.sessionId : '');
  res.json(db.prepare(`SELECT ${USER_COLS} FROM users WHERE id = ?`).get(id));
});

users.delete('/:id', (req, res) => {
  const id = Number(req.params.id);
  if (id === req.user.id) throw new HttpError(400, 'You cannot delete your own account.');
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(id);
  if (!user) throw new HttpError(404, 'User not found.');
  if (user.role === 'admin') assertAdminRemains(id);
  db.prepare('DELETE FROM users WHERE id = ?').run(id);
  res.json({ ok: true });
});

router.use('/users', users);

/* ------------------------- Gallery bulk helpers ------------------------- */

router.post('/images/bulk', (req, res) => {
  const albumId = Number(req.body?.album_id);
  const urls = Array.isArray(req.body?.urls) ? req.body.urls.map(String).filter(Boolean) : [];
  if (!db.prepare('SELECT id FROM albums WHERE id = ?').get(albumId)) throw new HttpError(404, 'Album not found.');
  if (!urls.length) throw new HttpError(400, 'No images to add.');
  const start = db.prepare('SELECT COALESCE(MAX(sort_order), 0) AS n FROM images WHERE album_id = ?').get(albumId).n;
  tx(() => urls.forEach((url, i) => db.prepare('INSERT INTO images (album_id, url, sort_order) VALUES (?, ?, ?)').run(albumId, url, start + i + 1)));
  res.status(201).json(listResource(RESOURCES.images, { album_id: albumId }));
});

/* ------------------------ Generic resource CRUD ------------------------ */

function resourceDef(req) {
  const def = RESOURCES[req.params.resource];
  if (!def) throw new HttpError(404, 'Unknown resource.');
  return def;
}

router.get('/:resource', (req, res) => res.json(listResource(resourceDef(req), req.query)));

router.get('/:resource/:id', (req, res) => {
  const row = getRow(resourceDef(req), Number(req.params.id));
  if (!row) throw new HttpError(404, 'Record not found.');
  res.json(row);
});

router.post('/:resource/reorder', (req, res) => {
  const def = resourceDef(req);
  const ids = Array.isArray(req.body?.ids) ? req.body.ids.map(Number).filter(Boolean) : [];
  tx(() => ids.forEach((id, i) => db.prepare(`UPDATE ${def.table} SET sort_order = ? WHERE id = ?`).run(i + 1, id)));
  res.json({ ok: true });
});

router.post('/:resource', (req, res) => {
  const def = resourceDef(req);
  res.status(201).json(insertRow(def, sanitize(def, req.body || {})));
});

router.put('/:resource/:id', (req, res) => {
  const def = resourceDef(req);
  const id = Number(req.params.id);
  if (!getRow(def, id)) throw new HttpError(404, 'Record not found.');
  res.json(updateRow(def, id, sanitize(def, req.body || {}, id)));
});

router.delete('/:resource/:id', (req, res) => {
  const def = resourceDef(req);
  const { changes } = db.prepare(`DELETE FROM ${def.table} WHERE id = ?`).run(Number(req.params.id));
  if (!changes) throw new HttpError(404, 'Record not found.');
  res.json({ ok: true });
});

export default router;
