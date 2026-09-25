import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import multer from 'multer';
import { UPLOAD_DIR, MAX_UPLOAD_MB } from '../config.js';
import { HttpError } from './utils.js';

const ALLOWED = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
  'image/gif': '.gif',
  'image/avif': '.avif',
  'image/x-icon': '.ico',
  'image/vnd.microsoft.icon': '.ico',
};

const storage = multer.diskStorage({
  destination(req, file, cb) {
    const d = new Date();
    const dir = path.join(UPLOAD_DIR, String(d.getFullYear()), String(d.getMonth() + 1).padStart(2, '0'));
    fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename(req, file, cb) {
    cb(null, `${Date.now().toString(36)}-${crypto.randomBytes(6).toString('hex')}${ALLOWED[file.mimetype]}`);
  },
});

export const upload = multer({
  storage,
  limits: { fileSize: MAX_UPLOAD_MB * 1024 * 1024, files: 40 },
  fileFilter(req, file, cb) {
    if (ALLOWED[file.mimetype]) cb(null, true);
    else cb(new HttpError(400, 'Only image files (JPG, PNG, WEBP, GIF, AVIF, ICO) can be uploaded.'));
  },
});

export const fileUrl = (file) => '/uploads/' + path.relative(UPLOAD_DIR, file.path).split(path.sep).join('/');
