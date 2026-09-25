import { Router } from 'express';
import bcrypt from 'bcryptjs';
import rateLimit from 'express-rate-limit';
import { db, tx, isInstalled, getSettings, setKV } from '../db.js';
import { upload, fileUrl } from '../lib/upload.js';
import { signToken, publicUser } from '../lib/auth.js';
import { HttpError, isEmail } from '../lib/utils.js';
import { seedSampleData } from '../seed.js';

const router = Router();
const HEX = /^#[0-9a-f]{6}$/i;

router.get('/status', (req, res) => res.json({ installed: isInstalled() }));

router.post(
  '/',
  rateLimit({ windowMs: 15 * 60 * 1000, limit: 20 }),
  upload.fields([{ name: 'logo', maxCount: 1 }]),
  (req, res) => {
    if (isInstalled()) throw new HttpError(409, 'This school has already been registered.');

    const b = req.body;
    const schoolName = String(b.schoolName || '').trim();
    const adminName = String(b.adminName || '').trim();
    const email = String(b.email || '').trim().toLowerCase();
    const password = String(b.password || '');

    if (schoolName.length < 3) throw new HttpError(400, 'Please enter the full school name.');
    if (!adminName) throw new HttpError(400, 'Please enter the administrator’s name.');
    if (!isEmail(email)) throw new HttpError(400, 'Please enter a valid email address.');
    if (password.length < 8) throw new HttpError(400, 'The password must be at least 8 characters long.');

    const logoFile = req.files?.logo?.[0];
    const current = getSettings();
    const settings = {
      ...current,
      schoolName,
      shortName: String(b.shortName || '').trim(),
      motto: String(b.motto || current.motto).trim(),
      established: String(b.established || '').trim(),
      logo: logoFile ? fileUrl(logoFile) : current.logo,
      theme: {
        ...current.theme,
        primary: HEX.test(b.primary) ? b.primary : current.theme.primary,
        accent: HEX.test(b.accent) ? b.accent : current.theme.accent,
        dark: HEX.test(b.dark) ? b.dark : current.theme.dark,
      },
      contact: {
        ...current.contact,
        email: String(b.contactEmail || current.contact.email).trim(),
        phone: String(b.contactPhone || current.contact.phone).trim(),
        address: String(b.contactAddress || current.contact.address).trim(),
      },
    };

    const user = tx(() => {
      setKV('settings', settings);
      const hash = bcrypt.hashSync(password, 10);
      const r = db
        .prepare("INSERT INTO users (name, email, password_hash, role, last_login) VALUES (?, ?, ?, 'admin', CURRENT_TIMESTAMP)")
        .run(adminName, email, hash);
      if (b.sampleData === 'true' || b.sampleData === true) seedSampleData();
      return db.prepare('SELECT * FROM users WHERE id = ?').get(Number(r.lastInsertRowid));
    });

    res.status(201).json({ token: signToken(user, req), user: publicUser(user) });
  }
);

export default router;
