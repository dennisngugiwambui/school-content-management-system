# School Website & CMS

A dynamic school website (React) with a built-in content management system (Node.js + SQLite).
Everything on the site (name, colours, images, pages, staff, prefects, results, fees, events) is edited from the admin panel.

## Run it on your computer

```bash
npm run install:all      # installs the root, server and client packages
npm run dev:server       # API on http://localhost:5050 (restarts when code changes)
npm run dev:client       # website on http://localhost:5173
```

Open http://localhost:5173 and follow the setup wizard, then sign in at `/portal`.

For a single production server: `npm run build` then `npm start` (the API also serves the built site on port 5050).

## Publish the public website on GitHub Pages (free)

GitHub Pages hosts static files only, so it shows the **public website**. The admin panel keeps running on
your computer or server: edit content there, then deploy again to update the live site.

1. Create an empty repository on GitHub, e.g. `school-website`.
2. In this folder:

   ```bash
   git init
   git add .
   git commit -m "School website"
   git branch -M main
   git remote add origin https://github.com/<your-username>/school-website.git
   git push -u origin main
   ```

3. Publish:

   ```bash
   npm run pages:deploy
   ```

   This builds the site, exports the current content and photos from your database,
   and pushes it to a `gh-pages` branch.
4. On GitHub: **Settings → Pages → Build and deployment → Deploy from a branch → `gh-pages` / `(root)`**.
   After a minute the site is live at `https://<your-username>.github.io/school-website/`.

Run `npm run pages:deploy` again whenever you change content in the admin panel.

Options:
- Preview before publishing: `npm run pages:build`, then `npm run pages:preview`.
- Link the Portal page to your running CMS: set `VITE_ADMIN_URL=https://your-cms-address` before deploying.
- Different path: set `PAGES_BASE=/my-path/` (a repository named `<username>.github.io` is served from `/` automatically).

The database (`server/data`, with passwords and sessions) and `server/uploads` are never committed to git
(see `.gitignore`); only the public content and photos are published to GitHub Pages.

## Edit content online: CMS on Render (free) + automatic Pages updates

So admins can sign in from anywhere, the CMS runs on [Render](https://render.com)'s free plan and the
GitHub Pages site rebuilds itself after every change:

- Render's free disk is wiped on every restart, so each change made in the admin panel is saved to the
  repository's **`cms-data` branch**: the database encrypted with `BACKUP_KEY`, plus the uploaded files.
  The server restores from it when it starts (`server/src/lib/backup.js`).
- Each save to `cms-data` runs the **Publish website** GitHub Action (`.github/workflows/pages.yml`), which
  rebuilds the Pages site with the new content, usually within a few minutes.
- The Portal button on the Pages site opens the CMS on Render.

One-time setup:

1. **Token:** GitHub → Settings → Developer settings → Fine-grained tokens → Generate. Repository access:
   only this repository; permissions: **Contents: Read and write**.
2. **Backup key:** any long random password (e.g. from a password manager). Keep it safe: without it the
   saved database cannot be read.
3. **Save the current content** from your computer: put `GITHUB_TOKEN`, `GITHUB_REPO` and `BACKUP_KEY` in
   `server/.env` (see `.env.example`), then run `npm --prefix server run backup`.
4. **Render:** New → Blueprint → pick this repository (it reads `render.yaml`) and enter `GITHUB_TOKEN`
   and `BACKUP_KEY` when asked. Note the address it gets, e.g. `https://school-cms.onrender.com`.
5. **GitHub repository → Settings → Secrets and variables → Actions:** add the secret `BACKUP_KEY` and the
   variable `ADMIN_URL` (the Render address). Optionally add the variable `SCHOOL_PORTAL_URL`.
6. **Settings → Actions → General → Workflow permissions:** Read and write. Then run **Publish website**
   once from the Actions tab.

Admins now sign in at `<Render address>/portal` (or via the Portal button). Free Render services sleep
after 15 minutes without visitors, so the first sign-in of the day can take about a minute.
Use one place for editing: once Render is set up, edit there rather than on your computer
(your computer's copy is not updated from the backup).

## Portal: website admin + school management system

The **Portal** button opens one sign-in page with two options:

- **School portal**: links to the school management system (`School-ERP-system-Available-for-demo-`)
  where students, parents, teachers and staff sign in.
- **Website administrators**: the form below it signs in to this CMS to edit the website.

Recommended hosting on one domain, e.g. `yourschool.co.ke`:

| Address | What runs there |
|---|---|
| `yourschool.co.ke` (and `www.`) | This website + CMS (`npm run build`, then `npm start`; port 5050) |
| `portal.yourschool.co.ke` | The school management system (its frontend on port 3000 and its API on 5000) |

1. Add DNS records for `@`, `www` and `portal` pointing to your server.
2. In the management system's `backend/.env`, set `FRONTEND_URL=https://portal.yourschool.co.ke`.
3. The school portal link works out its own address: on `yourschool.co.ke` it goes to
   `https://portal.yourschool.co.ke/login`, and on your computer to `http://localhost:3000/login`.
   To use a different address, set it in **Admin → Page Banners & Menu → Portal (login page) → School portal address**
   (or build with `VITE_SCHOOL_PORTAL_URL=...`). You can also change the link text or hide it there.

On GitHub Pages the address can't be guessed, so set the school portal address in the admin panel before deploying.

## Security notes

- Admin sessions end after 30 minutes of inactivity and after 12 hours at most
  (`SESSION_IDLE_MINUTES`, `SESSION_MAX_HOURS` in `server/.env`). Signing out ends the session on the server.
- Sign-in is limited to 10 attempts per 15 minutes; all database queries are parameterised.
