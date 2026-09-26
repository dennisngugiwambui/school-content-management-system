import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import { CLIENT_DIST, ROOT, UPLOAD_DIR } from '../config.js';

// Bundled default photos live in the client (public/ in development, dist/ once built).
const IMAGE_DIRS = [path.join(CLIENT_DIST, 'images'), path.resolve(ROOT, '..', 'client', 'public', 'images')];

const inside = (base, rel) => {
  const file = path.resolve(base, rel);
  return file.startsWith(path.resolve(base) + path.sep) && fs.existsSync(file) && fs.statSync(file).isFile() ? file : null;
};

/**
 * Maps a site image URL (/uploads/… or /images/…) to a file on disk.
 * Anything else, including paths that try to climb out of those folders, resolves to null.
 */
export function localFile(url) {
  const clean = decodeURIComponent(String(url || '').split(/[?#]/)[0]);
  if (clean.startsWith('/uploads/')) return inside(UPLOAD_DIR, clean.slice('/uploads/'.length));
  if (clean.startsWith('/images/')) {
    for (const dir of IMAGE_DIRS) {
      const f = inside(dir, clean.slice('/images/'.length));
      if (f) return f;
    }
  }
  return null;
}

/** A safe, readable file name such as "sports-day-03.jpg". */
export function niceName(label, file, index) {
  const base = String(label || 'image').toLowerCase().normalize('NFKD').replace(/[/\\]+/g, '-').replace(/[^\w\s-]/g, '').trim().replace(/[\s_]+/g, '-').slice(0, 60) || 'image';
  const num = index === undefined ? '' : `-${String(index + 1).padStart(2, '0')}`;
  return `${base}${num}${path.extname(file).toLowerCase() || '.jpg'}`;
}

/** Content-Disposition value that works for any file name. */
export const attachment = (name) => `attachment; filename="${name.replace(/[^\x20-\x7e]|"/g, '_')}"; filename*=UTF-8''${encodeURIComponent(name)}`;

/**
 * Streams a ZIP archive of local files to the response, one file in memory at a time.
 * Images are already compressed, so entries are stored as-is.
 */
export function sendZip(res, zipName, entries) {
  res.setHeader('Content-Type', 'application/zip');
  res.setHeader('Content-Disposition', attachment(zipName));
  const central = [];
  let offset = 0;
  const used = new Set();
  const now = new Date();
  const dosTime = (now.getHours() << 11) | (now.getMinutes() << 5) | (now.getSeconds() >> 1);
  const dosDate = ((now.getFullYear() - 1980) << 9) | ((now.getMonth() + 1) << 5) | now.getDate();

  for (const { file, name } of entries) {
    let entryName = name;
    for (let k = 2; used.has(entryName); k++) entryName = name.replace(/(\.\w+)?$/, `-${k}$1`);
    used.add(entryName);
    const data = fs.readFileSync(file);
    const nameBuf = Buffer.from(entryName, 'utf8');
    const crc = zlib.crc32(data);

    const local = Buffer.alloc(30);
    local.writeUInt32LE(0x04034b50, 0);
    local.writeUInt16LE(20, 4);
    local.writeUInt16LE(0x0800, 6); // UTF-8 names
    local.writeUInt16LE(0, 8); // stored
    local.writeUInt16LE(dosTime, 10);
    local.writeUInt16LE(dosDate, 12);
    local.writeUInt32LE(crc, 14);
    local.writeUInt32LE(data.length, 18);
    local.writeUInt32LE(data.length, 22);
    local.writeUInt16LE(nameBuf.length, 26);
    local.writeUInt16LE(0, 28);
    res.write(local);
    res.write(nameBuf);
    res.write(data);

    const cen = Buffer.alloc(46);
    cen.writeUInt32LE(0x02014b50, 0);
    cen.writeUInt16LE(20, 4);
    cen.writeUInt16LE(20, 6);
    cen.writeUInt16LE(0x0800, 8);
    cen.writeUInt16LE(0, 10);
    cen.writeUInt16LE(dosTime, 12);
    cen.writeUInt16LE(dosDate, 14);
    cen.writeUInt32LE(crc, 16);
    cen.writeUInt32LE(data.length, 20);
    cen.writeUInt32LE(data.length, 24);
    cen.writeUInt16LE(nameBuf.length, 28);
    cen.writeUInt32LE(offset, 42);
    central.push(cen, nameBuf);
    offset += 30 + nameBuf.length + data.length;
  }

  const cenSize = central.reduce((n, b) => n + b.length, 0);
  const end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0);
  end.writeUInt16LE(entries.length, 8);
  end.writeUInt16LE(entries.length, 10);
  end.writeUInt32LE(cenSize, 12);
  end.writeUInt32LE(offset, 16);
  central.forEach((b) => res.write(b));
  res.end(end);
}
