import crypto from 'node:crypto';
import jwt from 'jsonwebtoken';
import { db, getKV, setKV } from '../db.js';
import { SESSION_IDLE_MINUTES, SESSION_MAX_HOURS } from '../config.js';

const IDLE_MS = SESSION_IDLE_MINUTES * 60 * 1000;
const MAX_MS = SESSION_MAX_HOURS * 60 * 60 * 1000;
const TOUCH_MS = 30 * 1000; // write last_seen at most this often

let cachedSecret = null;

/** JWT secret from env, or generated once and persisted in the database. */
function getSecret() {
  if (cachedSecret) return cachedSecret;
  cachedSecret = process.env.JWT_SECRET || getKV('secret:jwt');
  if (!cachedSecret) {
    cachedSecret = crypto.randomBytes(48).toString('hex');
    setKV('secret:jwt', cachedSecret);
  }
  return cachedSecret;
}

export const publicUser = (u) => ({ id: u.id, name: u.name, email: u.email, role: u.role });

/**
 * Starts a server-side session and returns a token bound to it.
 * The token alone is not enough: every request also needs a live session row,
 * so sessions can expire from inactivity and be revoked on logout.
 */
export function signToken(user, req) {
  const now = Date.now();
  const sid = crypto.randomBytes(32).toString('hex');
  db.prepare('DELETE FROM sessions WHERE expires_at < ? OR last_seen < ?').run(now, now - IDLE_MS);
  db.prepare('INSERT INTO sessions (id, user_id, ip, user_agent, created_at, last_seen, expires_at) VALUES (?, ?, ?, ?, ?, ?, ?)')
    .run(sid, user.id, String(req?.ip || ''), String(req?.headers?.['user-agent'] || '').slice(0, 300), now, now, now + MAX_MS);
  return jwt.sign({ sub: user.id, sid }, getSecret(), { expiresIn: Math.floor(MAX_MS / 1000) });
}

/** Ends one session, or every session of a user (optionally keeping one). */
export function endSession(sid) {
  db.prepare('DELETE FROM sessions WHERE id = ?').run(sid);
}
export function endUserSessions(userId, keepSid = '') {
  db.prepare('DELETE FROM sessions WHERE user_id = ? AND id != ?').run(userId, keepSid);
}

export const sessionInfo = () => ({ idleMinutes: SESSION_IDLE_MINUTES, maxHours: SESSION_MAX_HOURS });

export function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'Please sign in to continue.' });
  let payload;
  try {
    payload = jwt.verify(token, getSecret());
  } catch {
    return res.status(401).json({ error: 'Your session has expired. Please sign in again.' });
  }
  const now = Date.now();
  const session = payload.sid && db.prepare('SELECT * FROM sessions WHERE id = ? AND user_id = ?').get(payload.sid, payload.sub);
  if (!session || session.expires_at < now || session.last_seen < now - IDLE_MS) {
    if (session) endSession(session.id);
    return res.status(401).json({ error: 'Your session has expired. Please sign in again.' });
  }
  const user = db.prepare('SELECT id, name, email, role, is_active FROM users WHERE id = ?').get(payload.sub);
  if (!user || !user.is_active) {
    endUserSessions(payload.sub);
    return res.status(401).json({ error: 'Your account is not active.' });
  }
  if (now - session.last_seen > TOUCH_MS) db.prepare('UPDATE sessions SET last_seen = ? WHERE id = ?').run(now, session.id);
  req.user = user;
  req.sessionId = session.id;
  next();
}

export const requireRole = (...roles) => (req, res, next) =>
  roles.includes(req.user?.role) ? next() : res.status(403).json({ error: 'You do not have permission to do that.' });
