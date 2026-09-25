# School Website & CMS

A dynamic school website (React) with a built-in content management system (Node.js + SQLite).
Everything on the site (name, colours, images, pages, staff, prefects, results, fees, events) is edited from the admin panel.

## Run it on your computer

```bash
npm run install:all      # installs the root, server and client packages
npm run dev:server       # API on http://localhost:5000 (restarts when code changes)
npm run dev:client       # website on http://localhost:5173
```

Open http://localhost:5173 and follow the setup wizard, then sign in at `/portal`.

For a single production server: `npm run build` then `npm start` (the API also serves the built site on port 5000).

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

## Security notes

- Admin sessions end after 30 minutes of inactivity and after 12 hours at most
  (`SESSION_IDLE_MINUTES`, `SESSION_MAX_HOURS` in `server/.env`). Signing out ends the session on the server.
- Sign-in is limited to 10 attempts per 15 minutes; all database queries are parameterised.
