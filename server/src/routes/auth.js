import { Router } from 'express';
import bcrypt from 'bcryptjs';
import rateLimit from 'express-rate-limit';
import { db } from '../db.js';
import { requireAuth, signToken, publicUser, endSession, endUserSessions, sessionInfo } from '../lib/auth.js';
import { HttpError, isEmail } from '../lib/utils.js';

const router = Router();

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: { error: 'Too many sign-in attempts. Please wait a few minutes and try again.' },
});

router.post('/login', loginLimiter, (req, res) => {
  const email = String(req.body?.email || '').trim().toLowerCase();
  const password = String(req.body?.password || '');
  if (!email || !password) throw new HttpError(400, 'Please enter your email and password.');

  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
  if (!user || !bcrypt.compareSync(password, user.password_hash)) {
    throw new HttpError(401, 'Incorrect email or password.');
  }
  if (!user.is_active) throw new HttpError(403, 'This account has been deactivated. Contact the administrator.');

  db.prepare('UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?').run(user.id);
  res.json({ token: signToken(user, req), user: publicUser(user), session: sessionInfo() });
});

router.post('/logout', requireAuth, (req, res) => {
  endSession(req.sessionId);
  res.json({ ok: true });
});

/** Signs out every other device using this account. */
router.post('/logout-others', requireAuth, (req, res) => {
  endUserSessions(req.user.id, req.sessionId);
  res.json({ ok: true });
});

router.get('/me', requireAuth, (req, res) => res.json({ user: publicUser(req.user), session: sessionInfo() }));

router.put('/profile', requireAuth, (req, res) => {
  const name = String(req.body?.name || '').trim();
  const email = String(req.body?.email || '').trim().toLowerCase();
  if (!name) throw new HttpError(400, 'Name is required.');
  if (!isEmail(email)) throw new HttpError(400, 'Please enter a valid email address.');
  const taken = db.prepare('SELECT id FROM users WHERE email = ? AND id != ?').get(email, req.user.id);
  if (taken) throw new HttpError(409, 'Another account already uses that email.');
  db.prepare('UPDATE users SET name = ?, email = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(name, email, req.user.id);
  res.json({ user: publicUser({ ...req.user, name, email }) });
});

router.put('/password', requireAuth, (req, res) => {
  const { current = '', next = '' } = req.body || {};
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id);
  if (!bcrypt.compareSync(String(current), user.password_hash)) throw new HttpError(400, 'Your current password is incorrect.');
  if (String(next).length < 8) throw new HttpError(400, 'The new password must be at least 8 characters long.');
  db.prepare('UPDATE users SET password_hash = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(bcrypt.hashSync(String(next), 10), user.id);
  // A new password signs out every other device.
  endUserSessions(user.id, req.sessionId);
  res.json({ ok: true });
});

export default router;
