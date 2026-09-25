// Recover access: create an admin account or reset its password.
//   npm run admin -- list
//   npm run admin -- reset <email> <new-password> [name]
import bcrypt from 'bcryptjs';
import { db } from './db.js';
import { isEmail } from './lib/utils.js';

const [cmd, rawEmail, password, ...nameParts] = process.argv.slice(2);

if (cmd === 'list') {
  const rows = db.prepare('SELECT id, name, email, role, is_active FROM users ORDER BY id').all();
  if (!rows.length) console.log('No accounts yet. Open the website to run the setup wizard.');
  for (const u of rows) console.log(`${u.id}. ${u.email}  (${u.name}, ${u.role}${u.is_active ? '' : ', deactivated'})`);
} else if (cmd === 'reset') {
  const email = String(rawEmail || '').trim().toLowerCase();
  if (!isEmail(email)) { console.error('Please give a valid email address.'); process.exit(1); }
  if (String(password || '').length < 8) { console.error('The password must be at least 8 characters long.'); process.exit(1); }
  const hash = bcrypt.hashSync(password, 10);
  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
  if (existing) {
    db.prepare("UPDATE users SET password_hash = ?, is_active = 1, role = 'admin', updated_at = CURRENT_TIMESTAMP WHERE id = ?").run(hash, existing.id);
    console.log(`Password reset for ${email}. The account is active and has admin rights.`);
  } else {
    db.prepare("INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, 'admin')").run(nameParts.join(' ') || 'Administrator', email, hash);
    console.log(`Created admin account ${email}.`);
  }
} else {
  console.log('Usage:\n  npm run admin -- list\n  npm run admin -- reset <email> <new-password> [name]');
}
