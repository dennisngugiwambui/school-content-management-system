import 'dotenv/config';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export const ROOT = path.resolve(__dirname, '..');
export const PORT = Number(process.env.PORT) || 5050;
export const IS_PROD = process.env.NODE_ENV === 'production';
export const DATA_DIR = path.resolve(ROOT, process.env.DATA_DIR || 'data');
export const UPLOAD_DIR = path.resolve(ROOT, process.env.UPLOAD_DIR || 'uploads');
export const CLIENT_DIST = path.resolve(ROOT, '..', 'client', 'dist');
export const CORS_ORIGIN = process.env.CORS_ORIGIN || '';
/** Admin sessions end after this much inactivity, and in any case after SESSION_MAX_HOURS. */
export const SESSION_IDLE_MINUTES = Number(process.env.SESSION_IDLE_MINUTES) || 30;
export const SESSION_MAX_HOURS = Number(process.env.SESSION_MAX_HOURS) || 12;
export const MAX_UPLOAD_MB = Number(process.env.MAX_UPLOAD_MB) || 10;
/** Tender documents and other PDFs can be larger than photos. */
export const MAX_DOCUMENT_MB = Number(process.env.MAX_DOCUMENT_MB) || 25;
