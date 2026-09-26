import fs from 'node:fs';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { DATA_DIR } from './config.js';
import { deepMerge } from './lib/utils.js';
import { DEFAULT_SETTINGS, DEFAULT_CONTENT } from './defaults.js';

fs.mkdirSync(DATA_DIR, { recursive: true });

export const db = new DatabaseSync(path.join(DATA_DIR, 'school.db'));

db.exec(`
  PRAGMA journal_mode = WAL;
  PRAGMA foreign_keys = ON;

  CREATE TABLE IF NOT EXISTS kv (
    key         TEXT PRIMARY KEY,
    value       TEXT NOT NULL,
    updated_at  TEXT DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS users (
    id             INTEGER PRIMARY KEY AUTOINCREMENT,
    name           TEXT NOT NULL,
    email          TEXT NOT NULL UNIQUE COLLATE NOCASE,
    password_hash  TEXT NOT NULL,
    role           TEXT NOT NULL DEFAULT 'editor',
    is_active      INTEGER NOT NULL DEFAULT 1,
    last_login     TEXT,
    created_at     TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at     TEXT DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS departments (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    name         TEXT NOT NULL,
    slug         TEXT NOT NULL UNIQUE,
    summary      TEXT DEFAULT '',
    description  TEXT DEFAULT '',
    image        TEXT DEFAULT '',
    icon         TEXT DEFAULT 'journal-bookmark',
    head_id      INTEGER REFERENCES staff(id) ON DELETE SET NULL,
    sort_order   INTEGER NOT NULL DEFAULT 0,
    is_active    INTEGER NOT NULL DEFAULT 1,
    created_at   TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at   TEXT DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS staff (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    name            TEXT NOT NULL,
    position        TEXT DEFAULT '',
    tier            TEXT DEFAULT 'teacher',
    department_id   INTEGER REFERENCES departments(id) ON DELETE SET NULL,
    parent_id       INTEGER REFERENCES staff(id) ON DELETE SET NULL,
    photo           TEXT DEFAULT '',
    bio             TEXT DEFAULT '',
    email           TEXT DEFAULT '',
    phone           TEXT DEFAULT '',
    qualifications  TEXT DEFAULT '',
    featured        INTEGER NOT NULL DEFAULT 0,
    sort_order      INTEGER NOT NULL DEFAULT 0,
    is_active       INTEGER NOT NULL DEFAULT 1,
    created_at      TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at      TEXT DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS prefects (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    name         TEXT NOT NULL,
    position     TEXT DEFAULT '',
    tier         TEXT DEFAULT 'prefect',
    class_name   TEXT DEFAULT '',
    house        TEXT DEFAULT '',
    photo        TEXT DEFAULT '',
    quote        TEXT DEFAULT '',
    show_photo   INTEGER NOT NULL DEFAULT 0,
    sort_order   INTEGER NOT NULL DEFAULT 0,
    is_active    INTEGER NOT NULL DEFAULT 1,
    created_at   TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at   TEXT DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS albums (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    title        TEXT NOT NULL,
    slug         TEXT NOT NULL UNIQUE,
    description  TEXT DEFAULT '',
    cover        TEXT DEFAULT '',
    event_date   TEXT DEFAULT '',
    sort_order   INTEGER NOT NULL DEFAULT 0,
    is_active    INTEGER NOT NULL DEFAULT 1,
    created_at   TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at   TEXT DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS images (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    album_id    INTEGER NOT NULL REFERENCES albums(id) ON DELETE CASCADE,
    url         TEXT NOT NULL,
    caption     TEXT DEFAULT '',
    sort_order  INTEGER NOT NULL DEFAULT 0,
    created_at  TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at  TEXT DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS news (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    title         TEXT NOT NULL,
    slug          TEXT NOT NULL UNIQUE,
    category      TEXT DEFAULT 'news',
    excerpt       TEXT DEFAULT '',
    body          TEXT DEFAULT '',
    image         TEXT DEFAULT '',
    event_date    TEXT DEFAULT '',
    location      TEXT DEFAULT '',
    is_published  INTEGER NOT NULL DEFAULT 1,
    sort_order    INTEGER NOT NULL DEFAULT 0,
    created_at    TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at    TEXT DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS sessions (
    id          TEXT PRIMARY KEY,
    user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    ip          TEXT DEFAULT '',
    user_agent  TEXT DEFAULT '',
    created_at  INTEGER NOT NULL,
    last_seen   INTEGER NOT NULL,
    expires_at  INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS tenders (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    title         TEXT NOT NULL,
    reference     TEXT DEFAULT '',
    category      TEXT DEFAULT '',
    description   TEXT DEFAULT '',
    file          TEXT DEFAULT '',
    file_name     TEXT DEFAULT '',
    file_size     INTEGER NOT NULL DEFAULT 0,
    opening_date  TEXT DEFAULT '',
    closing_date  TEXT DEFAULT '',
    status        TEXT NOT NULL DEFAULT 'open',
    awarded_to    TEXT DEFAULT '',
    is_published  INTEGER NOT NULL DEFAULT 1,
    sort_order    INTEGER NOT NULL DEFAULT 0,
    created_at    TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at    TEXT DEFAULT CURRENT_TIMESTAMP
  );

  CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);
  CREATE INDEX IF NOT EXISTS idx_staff_dept   ON staff(department_id);
  CREATE INDEX IF NOT EXISTS idx_staff_parent ON staff(parent_id);
  CREATE INDEX IF NOT EXISTS idx_images_album ON images(album_id);
`);

/** Run fn inside a transaction; rolls back on any thrown error. */
export function tx(fn) {
  db.exec('BEGIN');
  try {
    const result = fn();
    db.exec('COMMIT');
    return result;
  } catch (err) {
    db.exec('ROLLBACK');
    throw err;
  }
}

export function getKV(key, fallback = null) {
  const row = db.prepare('SELECT value FROM kv WHERE key = ?').get(key);
  if (!row) return fallback;
  try {
    return JSON.parse(row.value);
  } catch {
    return fallback;
  }
}

export function setKV(key, value) {
  db.prepare(
    `INSERT INTO kv (key, value, updated_at) VALUES (?, ?, CURRENT_TIMESTAMP)
     ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = CURRENT_TIMESTAMP`
  ).run(key, JSON.stringify(value));
}

/** Settings merged over defaults so newly-added fields always exist. */
export function getSettings() {
  return deepMerge(DEFAULT_SETTINGS, getKV('settings', {}));
}

export function getContent(key) {
  return deepMerge(DEFAULT_CONTENT[key] ?? {}, getKV(`content:${key}`, {}));
}

export function getAllContent() {
  return Object.fromEntries(Object.keys(DEFAULT_CONTENT).map((k) => [k, getContent(k)]));
}

export function isInstalled() {
  return db.prepare('SELECT COUNT(*) AS n FROM users').get().n > 0;
}
