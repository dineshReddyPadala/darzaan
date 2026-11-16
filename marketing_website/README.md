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

1. Host the frontend build (`dist/`) on your HTTPS static host, configured to rewrite non-asset routes to `index.html` for React Router.
2. Deploy the Node API behind HTTPS. Appointment and franchise rows live in the core Postgres database.
3. Route `/api/*` from the site domain to the API gateway, **or** set `VITE_API_URL=https://your-api-domain.example` before building. Same-origin proxy is preferred. If the site and API are on different origins, add the site origin to `CORS_ORIGINS`.
4. Confirm real boutique availability. The API accepts one active booking per time and consultation mode. A cancelled appointment releases that time.
5. Confirm store address, location(s), privacy policy, legal notices, customer support, and bank/financial disclosures before public launch.

Admin reviews requests in the staff app under Consultations. That screen lists appointment requests, the day’s open and held times, and franchise enquiries. Sign-in uses the staff API; this site does not expose those lists.

## Security and privacy

The frontend does **not** store customer personal data in localStorage. Booking and franchise forms call the API; failed calls display an error. The contact page routes to those forms and does not pretend to create an enquiry otherwise. Never put API secrets in `VITE_*` variables.

## Media

Logo and studio image originate from supplied Darzaan assets. Editorial imagery is illustrative concept photography and should be approved for commercial usage before launch.

## Important

This is deployment-oriented **source code**, not a claim of a fully deployed or independently audited production website. Live message delivery, domain/SSL, load testing, data-protection review and on-device QA require configured infrastructure.
