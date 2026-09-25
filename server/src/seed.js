import { db } from './db.js';
import { SAMPLE } from './defaults.js';
import { slugify } from './lib/utils.js';

const pic = (name) => `/images/${name}.jpg`;

/** Load demonstration records so a new site looks complete immediately. Call inside a transaction. */
export function seedSampleData() {
  const deptIds = {};
  SAMPLE.departments.forEach((d, i) => {
    const r = db
      .prepare('INSERT INTO departments (name, slug, summary, description, image, icon, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?)')
      .run(d.name, slugify(d.name), d.summary, `${d.summary}\n\nThe department is committed to helping every learner reach their full potential through dedicated teaching, continuous assessment and hands-on learning experiences.`, d.image || '', d.icon, i + 1);
    deptIds[d.key] = Number(r.lastInsertRowid);
  });

  const staffIds = {};
  SAMPLE.staff.forEach((s, i) => {
    const email = `${slugify(s.name.replace(/^(dr|mr|mrs|ms)\.?\s+/i, '')).replace(/-/g, '.')}@greenfield.co.ke`;
    const r = db
      .prepare(
        `INSERT INTO staff (name, position, tier, department_id, parent_id, photo, bio, email, qualifications, featured, sort_order)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .run(
        s.name, s.position, s.tier, s.dept ? deptIds[s.dept] : null, s.parent ? staffIds[s.parent] : null, s.photo || '',
        s.bio || `${s.position} committed to excellence in teaching and learner support.`, email,
        s.qualifications || '', s.featured || 0, i + 1
      );
    if (s.key) staffIds[s.key] = Number(r.lastInsertRowid);
    if (s.tier === 'hod' && s.dept) db.prepare('UPDATE departments SET head_id = ? WHERE id = ?').run(staffIds[s.key], deptIds[s.dept]);
  });

  SAMPLE.prefects.forEach((p, i) => {
    db.prepare('INSERT INTO prefects (name, position, tier, class_name, photo, quote, show_photo, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?, ?)')
      .run(p.name, p.position, p.tier, p.class_name, p.photo || '', p.quote || '', p.show_photo || 0, i + 1);
  });

  SAMPLE.albums.forEach((a, i) => {
    const r = db
      .prepare('INSERT INTO albums (title, slug, description, cover, event_date, sort_order) VALUES (?, ?, ?, ?, ?, ?)')
      .run(a.title, slugify(a.title), `Highlights from ${a.title.toLowerCase()}.`, pic(a.images[0]), new Date().toISOString().slice(0, 10), i + 1);
    a.images.forEach((name, j) => {
      db.prepare('INSERT INTO images (album_id, url, caption, sort_order) VALUES (?, ?, ?, ?)')
        .run(Number(r.lastInsertRowid), pic(name), `${a.title} — photo ${j + 1}`, j + 1);
    });
  });

  SAMPLE.news.forEach((n, i) => {
    const date = new Date(Date.now() + (n.days || -i * 9) * 86400000).toISOString().slice(0, 10);
    db.prepare(
      `INSERT INTO news (title, slug, category, excerpt, body, image, event_date, location, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now', ?))`
    ).run(
      n.title, slugify(n.title), n.category, n.excerpt,
      `${n.excerpt}\n\nThe school community continues to demonstrate its commitment to excellence. We thank our learners, staff and parents for their continued support.\n\nMore details will be shared through official school communication channels.`,
      n.image || '', n.category === 'event' ? date : '', n.location || '', `-${i * 6} days`
    );
  });
}

/**
 * Early installs were seeded with remote placeholder photos. Swap any that are
 * still in place for the bundled school photos. Runs once per database.
 */
export function replacePlaceholderPhotos() {
  addSamplePortraits();
  const FLAG = 'migration:local-photos';
  if (db.prepare('SELECT 1 FROM kv WHERE key = ?').get(FLAG)) return;
  const placeholder = "LIKE 'https://picsum.photos/%'";
  const photos = {
    departments: Object.fromEntries(SAMPLE.departments.map((d) => [d.name, d.image])),
    news: Object.fromEntries(SAMPLE.news.map((n) => [n.title, n.image])),
  };
  const pool = ['school-community', 'classroom', 'students-uniform', 'library', 'school-bus-trip', 'school-building', 'staff-and-students', 'classroom-desks'].map(pic);
  let n = 0;
  const next = () => pool[n++ % pool.length];

  db.exec('BEGIN');
  try {
    for (const d of db.prepare(`SELECT id, name FROM departments WHERE image ${placeholder}`).all()) {
      db.prepare('UPDATE departments SET image = ? WHERE id = ?').run(photos.departments[d.name] || next(), d.id);
    }
    for (const r of db.prepare(`SELECT id, title FROM news WHERE image ${placeholder}`).all()) {
      db.prepare('UPDATE news SET image = ? WHERE id = ?').run(photos.news[r.title] || next(), r.id);
    }
    for (const a of db.prepare('SELECT id, title FROM albums').all()) {
      const images = db.prepare(`SELECT id FROM images WHERE album_id = ? AND url ${placeholder} ORDER BY sort_order`).all(a.id);
      images.forEach((img) => db.prepare('UPDATE images SET url = ? WHERE id = ?').run(next(), img.id));
      const first = db.prepare('SELECT url FROM images WHERE album_id = ? ORDER BY sort_order LIMIT 1').get(a.id);
      db.prepare(`UPDATE albums SET cover = ? WHERE id = ? AND cover ${placeholder}`).run(first?.url || next(), a.id);
    }
    db.prepare('INSERT INTO kv (key, value) VALUES (?, ?)').run(FLAG, new Date().toISOString());
    db.exec('COMMIT');
  } catch (err) {
    db.exec('ROLLBACK');
    console.error('Could not replace placeholder photos:', err.message);
  }
}

/** Sample staff and prefects get their matching portraits when no photo was uploaded. Runs once. */
function addSamplePortraits() {
  const FLAG = 'migration:sample-portraits';
  if (db.prepare('SELECT 1 FROM kv WHERE key = ?').get(FLAG)) return;
  db.exec('BEGIN');
  try {
    for (const [table, list] of [['staff', SAMPLE.staff], ['prefects', SAMPLE.prefects]]) {
      for (const p of list.filter((x) => x.photo)) {
        db.prepare(`UPDATE ${table} SET photo = ? WHERE name = ? AND (photo IS NULL OR photo = '')`).run(p.photo, p.name);
      }
    }
    db.prepare('INSERT INTO kv (key, value) VALUES (?, ?)').run(FLAG, new Date().toISOString());
    db.exec('COMMIT');
  } catch (err) {
    db.exec('ROLLBACK');
    console.error('Could not add sample portraits:', err.message);
  }
}
