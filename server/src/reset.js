// Deletes the database so the site returns to the first-run registration wizard.
// Uploaded files are kept. Usage: npm run reset -- --yes
import fs from 'node:fs';
import path from 'node:path';
import { DATA_DIR } from './config.js';

if (!process.argv.includes('--yes')) {
  console.log('This permanently deletes all school data. Re-run with: npm run reset -- --yes');
  process.exit(1);
}
for (const f of ['school.db', 'school.db-wal', 'school.db-shm']) {
  fs.rmSync(path.join(DATA_DIR, f), { force: true });
}
console.log('Database removed. Start the server and open the site to register the school again.');
