# Darzaan web

The staff desk and the public shop. Screens, forms, placeholders, and field names match the reference in `webapp/`. This app connects those screens to the API when you ask it to.

## Scripts

```bash
cd web
npm install
npm run dev
```

Open http://localhost:5173.

- `npm run dev` — Vite with `--mode development` (reads `.env.development` or `.env.development.local`)
- `npm run build` — production bundle (`--mode production`)
- `npm run build:staging` — staging bundle
- `npm run preview` / `npm run preview:staging` — serve `dist/` after a build
- `npm run lint` — ESLint on TypeScript sources

## Environments

| Template | Local copy |
| --- | --- |
| `.env.development.example` | `.env.development` |
| `.env.staging.example` | `.env.staging` |
| `.env.production.example` | `.env.production` |

`.env.example` matches development. Vite loads `.env.[mode]` for the active mode.

Example development (live API):

```env
VITE_API_MODE=http
VITE_API_URL=http://localhost:3000
```

- `VITE_API_MODE=mock` — reference sample data, demo badge, prototype role switcher (omit or set in `.env.development.local`)
- `VITE_API_MODE=http` — staff login and saves through the gateway at `VITE_API_URL`

Staff password: `Darzaan#2026`. Example: `aditi.malhotra@darzaan.test`.

Start the API first. See `api/README.md`.

## Production (app.darzaan.com)

```bash
cp .env.production.example .env.production
npm run build
```

Copy `dist/` to the server (default path `/var/www/darzaan/app`). Nginx serves the SPA; the app calls `https://api.darzaan.com` baked in at build time. Full steps: [deploy/nginx/README.md](../deploy/nginx/README.md).

`web/Dockerfile` is optional for experiments; production does not run the staff app in Docker.

## Layout

`src/pages` and `src/components` are the reference screens. `src/services` is the HTTP client, session, and the save queue. Routes are lazy-loaded. Unknown desks show the 404 page.