/** Saves the current content to the GitHub backup branch: npm run backup (in server/). */
import { BACKUP_ON, BACKUP_BRANCH, runBackup } from './lib/backup.js';

if (!BACKUP_ON) {
  console.error('Set GITHUB_TOKEN, GITHUB_REPO and BACKUP_KEY in server/.env first.');
  process.exit(1);
}
await runBackup();
console.log(`Done. The content is saved in the "${BACKUP_BRANCH}" branch.`);
