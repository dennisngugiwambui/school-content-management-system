import fs from 'node:fs';
import path from 'node:path';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import multer from 'multer';
import { PORT, IS_PROD, UPLOAD_DIR, CLIENT_DIST, CORS_ORIGIN } from './config.js';
import './db.js';
import { replacePlaceholderPhotos } from './seed.js';
import setupRoutes from './routes/setup.js';
import authRoutes from './routes/auth.js';
import publicRoutes from './routes/public.js';
import adminRoutes from './routes/admin.js';

fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const app = express();
app.disable('x-powered-by');
app.set('trust proxy', 1);

app.use(
  helmet({
    // The CMS lets admins embed Google Maps and use remote images and Google Fonts.
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  })
);
app.use(compression());
if (CORS_ORIGIN) app.use(cors({ origin: CORS_ORIGIN.split(',').map((s) => s.trim()) }));
app.use(morgan(IS_PROD ? 'combined' : 'dev'));
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));

app.use('/uploads', express.static(UPLOAD_DIR, { maxAge: '30d', immutable: true, fallthrough: false }));

app.get('/api/health', (req, res) => res.json({ ok: true }));
app.use('/api/setup', setupRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/public', publicRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api', (req, res) => res.status(404).json({ error: 'Endpoint not found.' }));

// In production the built React app is served by this same server.
if (fs.existsSync(CLIENT_DIST)) {
  app.use(express.static(CLIENT_DIST, { index: false, maxAge: '7d' }));
  app.get('/{*splat}', (req, res) => res.sendFile(path.join(CLIENT_DIST, 'index.html')));
}

// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    const msg = err.code === 'LIMIT_FILE_SIZE' ? 'That file is too large.' : err.message;
    return res.status(400).json({ error: msg });
  }
  if (err.status === 404 && req.path.startsWith('/uploads')) return res.status(404).end();
  const status = err.status || err.statusCode || 500;
  if (status >= 500) console.error(err);
  res.status(status).json({ error: status >= 500 ? 'Something went wrong on the server.' : err.message });
});

replacePlaceholderPhotos();

app.listen(PORT, () => {
  console.log(`\n  School CMS API running at http://localhost:${PORT}\n`);
});
