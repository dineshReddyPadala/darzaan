# Darzaan — React + TypeScript + Tailwind CSS

A premium responsive Darzaan site with seven routes: Home, Collections, Services, Our Studio, Appointments, Franchise, and Contact. Uses the **green-and-gold logo and store concept supplied by Darzaan**. Includes booking and franchise forms connected to the included FastAPI backend.

## Quick start

- Install Node.js 22 or newer and Python 3.11+.
- `npm install`
- In a separate shell, run the included backend: `pip install -r backend/requirements.txt` then `uvicorn app:app --app-dir backend --host 127.0.0.1 --port 8000`
- Run the React dev server: `npm run dev`; Vite proxies `/api` to `http://localhost:8000`.
- Open the Vite URL printed in your terminal.

## Commands

- `npm run typecheck`: strict TypeScript checking
- `npm run build`: TypeScript check and production build into `dist/`
- `npm run preview`: preview the production frontend
- `npm test`: lightweight source contract checks

## Deployment

1. Host the frontend build (`dist/`) on your HTTPS static host, configured to rewrite non-asset routes to `index.html` for React Router.
2. Deploy the supplied FastAPI service separately behind HTTPS. Use persistent database storage, backup scheduling, and production secrets.
3. Route `/api/*` from your frontend domain to the FastAPI backend, **or** set `VITE_API_URL=https://your-api-domain.example` before building and configure explicit, restricted CORS on the API. Same-origin proxy is preferred.
4. Configure `DARZAAN_ADMIN_USER`, `DARZAAN_ADMIN_PASSWORD`, and other backend environment variables using the backend README.
5. Confirm real boutique availability. Current backend accepts one booking per time/mode; this is a demo scheduling rule, not a verified franchise-level capacity model.
6. For automated WhatsApp confirmations, configure Meta WhatsApp Business credentials and approved utility template on the backend. Test messages end to end.
7. Confirm store address, location(s), privacy policy, legal notices, customer support, and bank/financial disclosures before public launch.

## Security and privacy

The frontend does **not** store customer personal data in localStorage. Booking and franchise forms call the backend; failed API calls display an error. The contact page routes to those forms and does not pretend to create an enquiry otherwise. Never put WhatsApp API keys in `VITE_*` variables. The bundled backend uses SQLite; evaluate PostgreSQL/multi-location bookings for growth.

## Media

Logo and studio image originate from supplied Darzaan assets. Editorial imagery is illustrative concept photography and should be approved for commercial usage before launch.

## Important

This is deployment-oriented **source code**, not a claim of a fully deployed or independently audited production website. Live message delivery, domain/SSL, load testing, data-protection review and on-device QA require configured infrastructure.
