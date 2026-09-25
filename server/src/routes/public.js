import { Router } from 'express';
import { db, getSettings, getAllContent, getContent, isInstalled } from '../db.js';
import { HttpError } from '../lib/utils.js';
import { attachment, localFile, niceName, sendZip } from '../lib/files.js';

const router = Router();

const STAFF_COLUMNS = `s.id, s.name, s.position, s.tier, s.department_id, s.parent_id, s.photo, s.bio, s.email,
  s.phone, s.qualifications, s.featured, s.sort_order, d.name AS department_name, d.slug AS department_slug`;

const DEPT_LIST = `
  SELECT d.id, d.name, d.slug, d.summary, d.image, d.icon, d.head_id,
         h.name AS head_name, h.position AS head_position, h.photo AS head_photo,
         (SELECT COUNT(*) FROM staff x WHERE x.department_id = d.id AND x.is_active = 1) AS staff_count
  FROM departments d
  LEFT JOIN staff h ON h.id = d.head_id AND h.is_active = 1
  WHERE d.is_active = 1
  ORDER BY d.sort_order, d.name`;

const tierIndex = (tiers) => {
  const map = new Map(tiers.map((t, i) => [t.key, i]));
  return (key) => (map.has(key) ? map.get(key) : tiers.length);
};

function allStaff() {
  return db
    .prepare(`SELECT ${STAFF_COLUMNS} FROM staff s LEFT JOIN departments d ON d.id = s.department_id
              WHERE s.is_active = 1 ORDER BY s.sort_order, s.name`)
    .all();
}

// Everything the site shell needs in one request: identity, theme and page content.
router.get('/site', (req, res) => {
  res.set('Cache-Control', 'no-cache');
  res.json({
    installed: isInstalled(),
    settings: getSettings(),
    content: getAllContent(),
    departments: db.prepare('SELECT id, name, slug, icon FROM departments WHERE is_active = 1 ORDER BY sort_order, name').all(),
  });
});

router.get('/home', (req, res) => {
  const tiers = getContent('tiers');
  const staffRank = tierIndex(tiers.staff);
  const prefectRank = tierIndex(tiers.prefects);

  const staff = allStaff();
  let leaders = staff.filter((s) => s.featured);
  if (!leaders.length) leaders = [...staff].sort((a, b) => staffRank(a.tier) - staffRank(b.tier)).slice(0, 4);
  leaders.sort((a, b) => staffRank(a.tier) - staffRank(b.tier) || a.sort_order - b.sort_order);

  const prefects = db.prepare('SELECT * FROM prefects WHERE is_active = 1 ORDER BY sort_order, name').all();
  const topTier = tiers.prefects[0]?.key;
  const prefectLeaders = prefects
    .filter((p) => p.tier === topTier || p.show_photo)
    .sort((a, b) => prefectRank(a.tier) - prefectRank(b.tier) || a.sort_order - b.sort_order)
    .slice(0, 4);

  res.json({
    departments: db.prepare(DEPT_LIST).all().slice(0, 8),
    leaders: leaders.slice(0, 8),
    prefects: prefectLeaders,
    gallery: db
      .prepare(`SELECT i.id, i.url, i.caption, a.title AS album_title, a.id AS album_id
                FROM images i JOIN albums a ON a.id = i.album_id WHERE a.is_active = 1
                ORDER BY i.created_at DESC, i.id DESC LIMIT 8`)
      .all(),
    news: db.prepare('SELECT id, title, slug, category, excerpt, image, event_date, location, created_at FROM news WHERE is_published = 1 ORDER BY created_at DESC LIMIT 3').all(),
    events: db
      .prepare(`SELECT id, title, slug, excerpt, event_date, location FROM news
                WHERE is_published = 1 AND category = 'event' AND event_date >= date('now')
                ORDER BY event_date ASC LIMIT 4`)
      .all(),
    counts: {
      staff: staff.length,
      departments: db.prepare('SELECT COUNT(*) AS n FROM departments WHERE is_active = 1').get().n,
      prefects: prefects.length,
    },
  });
});

router.get('/departments', (req, res) => res.json(db.prepare(DEPT_LIST).all()));

router.get('/departments/:slug', (req, res) => {
  const dept = db.prepare('SELECT * FROM departments WHERE slug = ? AND is_active = 1').get(req.params.slug);
  if (!dept) throw new HttpError(404, 'Department not found.');
  const members = db
    .prepare(`SELECT ${STAFF_COLUMNS} FROM staff s LEFT JOIN departments d ON d.id = s.department_id
              WHERE s.department_id = ? AND s.is_active = 1 ORDER BY s.sort_order, s.name`)
    .all(dept.id);
  const head = dept.head_id
    ? db.prepare(`SELECT ${STAFF_COLUMNS} FROM staff s LEFT JOIN departments d ON d.id = s.department_id WHERE s.id = ? AND s.is_active = 1`).get(dept.head_id)
    : null;
  const others = db.prepare('SELECT id, name, slug, icon FROM departments WHERE is_active = 1 AND id != ? ORDER BY sort_order, name').all(dept.id);
  res.json({ department: dept, head, members: members.filter((m) => m.id !== dept.head_id), others });
});

router.get('/staff', (req, res) => res.json(allStaff()));

router.get('/prefects', (req, res) =>
  res.json(db.prepare('SELECT id, name, position, tier, class_name, house, photo, quote, show_photo, sort_order FROM prefects WHERE is_active = 1 ORDER BY sort_order, name').all())
);

router.get('/albums', (req, res) => {
  res.json(
    db
      .prepare(`SELECT a.id, a.title, a.slug, a.description, a.cover, a.event_date,
                  (SELECT COUNT(*) FROM images i WHERE i.album_id = a.id) AS image_count,
                  (SELECT url FROM images i WHERE i.album_id = a.id ORDER BY sort_order, id LIMIT 1) AS first_image
                FROM albums a WHERE a.is_active = 1 ORDER BY a.sort_order, a.id DESC`)
      .all()
  );
});

router.get('/gallery', (req, res) => {
  res.json(
    db
      .prepare(`SELECT i.id, i.url, i.caption, i.album_id, a.title AS album_title
                FROM images i JOIN albums a ON a.id = i.album_id
                WHERE a.is_active = 1 ORDER BY a.sort_order, a.id DESC, i.sort_order, i.id`)
      .all()
  );
});

router.get('/news', (req, res) => {
  const cat = req.query.category;
  const rows = cat
    ? db.prepare('SELECT id, title, slug, category, excerpt, image, event_date, location, created_at FROM news WHERE is_published = 1 AND category = ? ORDER BY created_at DESC').all(String(cat))
    : db.prepare('SELECT id, title, slug, category, excerpt, image, event_date, location, created_at FROM news WHERE is_published = 1 ORDER BY created_at DESC').all();
  res.json(rows);
});

router.get('/news/:slug', (req, res) => {
  const item = db.prepare('SELECT * FROM news WHERE slug = ? AND is_published = 1').get(req.params.slug);
  if (!item) throw new HttpError(404, 'Article not found.');
  const related = db
    .prepare('SELECT id, title, slug, category, image, created_at FROM news WHERE is_published = 1 AND id != ? ORDER BY created_at DESC LIMIT 3')
    .all(item.id);
  res.json({ item, related });
});

/* ------------------------------- Downloads -------------------------------- */

/** Downloads one site image as a file (only images stored on this site). */
router.get('/download', (req, res) => {
  const file = localFile(req.query.url);
  if (!file) throw new HttpError(404, 'File not found.');
  res.setHeader('Content-Disposition', attachment(niceName(req.query.name, file)));
  res.sendFile(file);
});

const zipOrFail = (res, name, entries) => {
  const found = entries.map((e) => ({ ...e, file: localFile(e.url) })).filter((e) => e.file);
  if (!found.length) throw new HttpError(404, 'There are no photos to download yet.');
  sendZip(res, name, found.map((e, i) => ({ file: e.file, name: niceName(e.label, e.file, e.numbered ? i : undefined) })));
};

/** Every photo in an album as one ZIP. */
router.get('/albums/:id/download', (req, res) => {
  const album = db.prepare('SELECT id, title, slug FROM albums WHERE id = ? AND is_active = 1').get(Number(req.params.id));
  if (!album) throw new HttpError(404, 'Album not found.');
  const photos = db.prepare('SELECT url FROM images WHERE album_id = ? ORDER BY sort_order, id').all(album.id);
  zipOrFail(res, niceName(album.title, 'album.zip'), photos.map((p) => ({ url: p.url, label: album.title, numbered: true })));
});

/** All published fee structures as one ZIP. */
router.get('/fees/download', (req, res) => {
  const docs = (getContent('fees')?.documents?.items ?? []).filter((d) => d.image);
  zipOrFail(res, 'fee-structures.zip', docs.map((d) => ({ url: d.image, label: d.title || 'fee-structure' })));
});

export default router;
