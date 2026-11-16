# Darzaan web

The staff desk and the public shop. Screens, forms, placeholders, and field names match the reference in `webapp/`. This app connects those screens to the API when you ask it to.

## Scripts

```bash
cd web
npm install
npm run dev
```

Open http://localhost:5173.

`npm run build` typechecks and writes `dist/`. `npm run lint` checks the TypeScript sources.

## Modes

Copy `.env.example` to `.env`.

- `VITE_API_MODE=mock` (the default) uses the reference sample data. A **Demo data** badge stays in the header, and the role switcher is the prototype one. Nothing is sent to a server.
- `VITE_API_MODE=http` signs in against the gateway at `VITE_API_URL` (http://localhost:3000). The signed-in role is the staff account. Orders, customers, production, QC, packing, deliveries, inventory, and settings save through the API.

Staff password: `Darzaan#2026`. Example: `aditi.malhotra@darzaan.test`.

Start the API first. See `api/README.md`.

## Layout

`src/pages` and `src/components` are the reference screens. `src/services` is the HTTP client, session, and the save queue. Routes are lazy-loaded. Unknown desks show the 404 page.
