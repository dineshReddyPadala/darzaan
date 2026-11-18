# Darzaan — React + TypeScript + Tailwind CSS

A premium responsive Darzaan site with seven routes: Home, Collections, Services, Our Studio, Appointments, Franchise, and Contact. Uses the **green-and-gold logo and store concept supplied by Darzaan**. Booking and franchise forms call the Node API in `api/`.

## Quick start

- Install Node.js 22 or newer.
- From `api/`, start the gateway and core service (Postgres must be reachable). The gateway listens on port 3000.
- In this folder: `npm install`, then `npm run dev`.
- Vite serves the site on port 5174 and proxies `/api` to `http://127.0.0.1:3000`.
- Open the Vite URL printed in your terminal.

## Commands

- `npm run typecheck`: strict TypeScript checking
- `npm run build`: TypeScript check and production build into `dist/`
- `npm run preview`: preview the production frontend
- `npm test`: lightweight source contract checks

## Deployment

Production DNS: `darzaan.com` → this build; API at `https://api.darzaan.com`; staff at `https://app.darzaan.com`.

```bash
cp .env.production.example .env.production
npm run build
```

Copy `dist/` to `/var/www/darzaan/www` on the VPS. Set `VITE_API_URL=https://api.darzaan.com` in `.env.production` before building (forms call the API cross-origin; the API `CORS_ORIGINS` must include `https://darzaan.com` and `https://www.darzaan.com`).

See [deploy/nginx/README.md](../deploy/nginx/README.md) for Nginx, TLS, and API compose on the same host.

Confirm real boutique availability, legal copy, and support details before public launch.

Admin reviews requests in the staff app under Consultations. That screen lists appointment requests, the day’s open and held times, and franchise enquiries. Sign-in uses the staff API; this site does not expose those lists.

## Security and privacy

The frontend does **not** store customer personal data in localStorage. Booking and franchise forms call the API; failed calls display an error. The contact page routes to those forms and does not pretend to create an enquiry otherwise. Never put API secrets in `VITE_*` variables.

## Media

Logo and studio image originate from supplied Darzaan assets. Editorial imagery is illustrative concept photography and should be approved for commercial usage before launch.

## Important

This is deployment-oriented **source code**, not a claim of a fully deployed or independently audited production website. Live message delivery, domain/SSL, load testing, data-protection review and on-device QA require configured infrastructure.
