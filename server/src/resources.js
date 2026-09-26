import { db } from './db.js';
import { HttpError, slugify } from './lib/utils.js';

/**
 * CMS resource definitions. Each entry whitelists the editable columns and how
 * they are coerced, so the generic admin CRUD router can never write anything else.
 */
export const TENDER_STATUSES = ['open', 'closed', 'awarded', 'cancelled'];

export const RESOURCES = {
  departments: {
    table: 'departments',
    fields: {
      name: 'string', slug: 'slug', summary: 'string', description: 'string', image: 'string',
      icon: 'string', head_id: 'ref', sort_order: 'int', is_active: 'bool',
    },
    required: ['name'],
    slugFrom: 'name',
    order: 'sort_order ASC, name ASC',
  },
  staff: {
    table: 'staff',
    fields: {
      name: 'string', position: 'string', tier: 'string', department_id: 'ref', parent_id: 'ref',
      photo: 'string', bio: 'string', email: 'string', phone: 'string', qualifications: 'string',
      featured: 'bool', sort_order: 'int', is_active: 'bool',
    },
    required: ['name'],
    order: 'sort_order ASC, name ASC',
    validate(data, id) {
      if (id && data.parent_id === Number(id)) throw new HttpError(400, 'A staff member cannot report to themselves.');
      if (id && data.parent_id) {
        // Walk up the chain to prevent reporting loops.
        let cursor = data.parent_id;
        const seen = new Set();
        while (cursor && !seen.has(cursor)) {
          if (cursor === Number(id)) throw new HttpError(400, 'That reporting line would create a loop in the hierarchy.');
          seen.add(cursor);
          cursor = db.prepare('SELECT parent_id FROM staff WHERE id = ?').get(cursor)?.parent_id;
        }
      }
    },
  },
  prefects: {
    table: 'prefects',
    fields: {
      name: 'string', position: 'string', tier: 'string', class_name: 'string', house: 'string',
      photo: 'string', quote: 'string', show_photo: 'bool', sort_order: 'int', is_active: 'bool',
    },
    required: ['name'],
    order: 'sort_order ASC, name ASC',
  },
  albums: {
    table: 'albums',
    fields: {
      title: 'string', slug: 'slug', description: 'string', cover: 'string', event_date: 'string',
      sort_order: 'int', is_active: 'bool',
    },
    required: ['title'],
    slugFrom: 'title',
    order: 'sort_order ASC, id DESC',
    list: `SELECT a.*, (SELECT COUNT(*) FROM images i WHERE i.album_id = a.id) AS image_count,
                  (SELECT url FROM images i WHERE i.album_id = a.id ORDER BY sort_order, id LIMIT 1) AS first_image
           FROM albums a`,
  },
  images: {
    table: 'images',
    fields: { album_id: 'ref', url: 'string', caption: 'string', sort_order: 'int' },
    required: ['album_id', 'url'],
    filters: ['album_id'],
    order: 'sort_order ASC, id ASC',
  },
  news: {
    table: 'news',
    fields: {
      title: 'string', slug: 'slug', category: 'string', excerpt: 'string', body: 'string', image: 'string',
      event_date: 'string', location: 'string', is_published: 'bool', sort_order: 'int', created_at: 'string',
    },
    required: ['title'],
    slugFrom: 'title',
    order: 'created_at DESC, id DESC',
  },
  tenders: {
    table: 'tenders',
    fields: {
      title: 'string', reference: 'string', category: 'string', description: 'string', file: 'string', file_name: 'string',
      file_size: 'int', opening_date: 'string', closing_date: 'string', status: 'string', awarded_to: 'string',
      is_published: 'bool', sort_order: 'int',
    },
    required: ['title'],
    order: 'created_at DESC, id DESC',
    validate(data) {
      if (data.status !== undefined && !TENDER_STATUSES.includes(data.status)) throw new HttpError(400, 'Invalid tender status.');
      if (data.file && !/^\/uploads\/[\w/.-]+$/.test(data.file) && !/^https?:\/\//.test(data.file)) throw new HttpError(400, 'Invalid tender document.');
    },
  },
};

function coerce(type, value) {
  switch (type) {
    case 'int':
      return Number.isFinite(Number(value)) ? Math.trunc(Number(value)) : 0;
    case 'bool':
      return value === true || value === 1 || value === '1' || value === 'true' ? 1 : 0;
    case 'ref':
      return value === '' || value === null || value === undefined || Number(value) <= 0 ? null : Math.trunc(Number(value));
    default:
      return value === null || value === undefined ? '' : String(value).trim();
  }
}

function uniqueSlug(table, base, id) {
  let slug = slugify(base);
  let n = 1;
  while (db.prepare(`SELECT id FROM ${table} WHERE slug = ? AND id != ?`).get(slug, id ?? 0)) {
    slug = `${slugify(base)}-${++n}`;
  }
  return slug;
}

/** Build a sanitised column → value map from an untrusted request body. */
export function sanitize(def, body, id) {
  const data = {};
  for (const [key, type] of Object.entries(def.fields)) {
    if (body[key] !== undefined) data[key] = coerce(type, body[key]);
  }
  if (!id) {
    for (const key of def.required) {
      if (data[key] === undefined || data[key] === '' || data[key] === null) {
        throw new HttpError(400, `The field "${key.replace(/_/g, ' ')}" is required.`);
      }
    }
  } else {
    for (const key of def.required) {
      if (key in data && (data[key] === '' || data[key] === null)) throw new HttpError(400, `The field "${key.replace(/_/g, ' ')}" cannot be empty.`);
    }
  }
  if (def.slugFrom) {
    const source = data.slug || data[def.slugFrom];
    if (source) data.slug = uniqueSlug(def.table, source, id);
  }
  def.validate?.(data, id);
  return data;
}

export function listResource(def, query = {}) {
  const where = [];
  const params = [];
  for (const f of def.filters ?? []) {
    if (query[f] !== undefined) {
      where.push(`${f} = ?`);
      params.push(query[f]);
    }
  }
  const base = def.list ?? `SELECT * FROM ${def.table}`;
  const sql = `${base}${where.length ? ` WHERE ${where.join(' AND ')}` : ''} ORDER BY ${def.order}`;
  return db.prepare(sql).all(...params);
}

export const getRow = (def, id) => db.prepare(`SELECT * FROM ${def.table} WHERE id = ?`).get(id);

export function insertRow(def, data) {
  const cols = Object.keys(data);
  if (!('sort_order' in data) && def.fields.sort_order) {
    cols.push('sort_order');
    data.sort_order = (db.prepare(`SELECT COALESCE(MAX(sort_order), 0) + 1 AS n FROM ${def.table}`).get().n);
  }
  const sql = `INSERT INTO ${def.table} (${cols.join(', ')}) VALUES (${cols.map(() => '?').join(', ')})`;
  const { lastInsertRowid } = db.prepare(sql).run(...cols.map((c) => data[c]));
  return getRow(def, Number(lastInsertRowid));
}

export function updateRow(def, id, data) {
  const cols = Object.keys(data);
  if (cols.length) {
    const sql = `UPDATE ${def.table} SET ${cols.map((c) => `${c} = ?`).join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`;
    db.prepare(sql).run(...cols.map((c) => data[c]), id);
  }
  return getRow(def, id);
}
