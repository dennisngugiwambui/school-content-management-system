import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import multer from 'multer';
import { UPLOAD_DIR, MAX_UPLOAD_MB, MAX_DOCUMENT_MB } from '../config.js';
import { HttpError } from './utils.js';

const IMAGES = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
  'image/gif': '.gif',
  'image/avif': '.avif',
  'image/x-icon': '.ico',
  'image/vnd.microsoft.icon': '.ico',
};

/** Documents (tenders, forms): the extension decides the type, and the file's first bytes must match it. */
const DOCUMENTS = {
  '.pdf': { magic: [Buffer.from('%PDF')] },
  '.docx': { magic: [Buffer.from('PK\x03\x04', 'binary')] },
  '.xlsx': { magic: [Buffer.from('PK\x03\x04', 'binary')] },
  '.doc': { magic: [Buffer.from('d0cf11e0a1b11ae1', 'hex')] },
  '.xls': { magic: [Buffer.from('d0cf11e0a1b11ae1', 'hex')] },
};

const storage = (ext) => multer.diskStorage({
  destination(req, file, cb) {
    const d = new Date();
    const dir = path.join(UPLOAD_DIR, String(d.getFullYear()), String(d.getMonth() + 1).padStart(2, '0'));
    fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename(req, file, cb) {
    cb(null, `${Date.now().toString(36)}-${crypto.randomBytes(6).toString('hex')}${ext(file)}`);
  },
});

export const upload = multer({
  storage: storage((file) => IMAGES[file.mimetype]),
  limits: { fileSize: MAX_UPLOAD_MB * 1024 * 1024, files: 40 },
  fileFilter(req, file, cb) {
    if (IMAGES[file.mimetype]) cb(null, true);
    else cb(new HttpError(400, 'Only image files (JPG, PNG, WEBP, GIF, AVIF, ICO) can be uploaded.'));
  },
});

const docExt = (file) => path.extname(file.originalname || '').toLowerCase();

export const uploadDocument = multer({
  storage: storage(docExt),
  limits: { fileSize: MAX_DOCUMENT_MB * 1024 * 1024, files: 1 },
  fileFilter(req, file, cb) {
    if (DOCUMENTS[docExt(file)]) cb(null, true);
    else cb(new HttpError(400, 'Only PDF, Word (DOC, DOCX) or Excel (XLS, XLSX) documents can be uploaded.'));
  },
});

/** Rejects (and deletes) an uploaded document whose contents do not match its extension. */
export function verifyDocument(file) {
  const { magic } = DOCUMENTS[path.extname(file.path).toLowerCase()] ?? { magic: [] };
  const head = Buffer.alloc(8);
  const fd = fs.openSync(file.path, 'r');
  try { fs.readSync(fd, head, 0, 8, 0); } finally { fs.closeSync(fd); }
  if (!magic.some((m) => head.subarray(0, m.length).equals(m))) {
    fs.rmSync(file.path, { force: true });
    throw new HttpError(400, 'That file does not look like a valid document. Please upload the original PDF, Word or Excel file.');
  }
}

export const fileUrl = (file) => '/uploads/' + path.relative(UPLOAD_DIR, file.path).split(path.sep).join('/');
