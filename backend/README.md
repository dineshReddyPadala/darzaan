# Darzaan – production deployment candidate

A self-hosted, responsive Darzaan fashion website based on the approved clean-green prototype. The existing six sections (Home, Collections, Services, Studio, Appointments, Franchise) and supplied green/gold Darzaan branding are retained. Customers can request appointments and franchise information; data is centrally stored in SQLite.

## Run locally

Requirements: Python 3.11+.

```bash
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
export ADMIN_USERNAME=darzaan-admin
export ADMIN_PASSWORD='REPLACE_WITH_A_STRONG_RANDOM_PASSWORD'
uvicorn app:app --reload
```

Browse http://127.0.0.1:8000. The booking UI is part of the website. Successful appointment requests appear in a server database and occupy the selected slot until cancelled. Appointments are **requests**, not automatically confirmed.

## Live deployment

Use a host that supports Python/ASGI and a **persistent data volume**, e.g. a VM or Docker host. Deploy the `Dockerfile` behind a managed HTTPS reverse proxy and point a verified domain at it. Put `DARZAAN_DB_PATH` on a backed-up persistent volume, not the container's ephemeral filesystem. Set `FORCE_HTTPS=1` only behind a properly configured HTTPS proxy. Restrict admin endpoints via reverse-proxy IP rules or VPN when possible.

Example docker command after build:

```bash
docker build -t darzaan:latest .
docker run -d --name darzaan --restart unless-stopped -p 127.0.0.1:8000:8000 \
  -e ADMIN_USERNAME=darzaan-admin -e ADMIN_PASSWORD='CHANGE_TO_RANDOM_LONG_SECRET' \
  -e DARZAAN_DB_PATH=/var/lib/darzaan/darzaan.sqlite3 \
  -v darzaan-data:/var/lib/darzaan darzaan:latest
```

### Admin access

CSV export: `GET /api/admin/export?kind=appointments` or `?kind=franchise` with HTTP Basic credentials (e.g. `curl -u USER:PASS URL`). Appointment list: `GET /api/admin/appointments`. Appointment status update: `PATCH /api/admin/appointments/DZ-XXXX?status=confirmed` (allowed: requested, confirmed, cancelled, completed). **Never include credentials in public pages.** This is an API, not a finished graphical staff portal. Protect Basic auth with TLS; use a VPN or SSO gateway for staff access. `ADMIN_PASSWORD` must be configured before launch.

### WhatsApp automation

Set all: `WHATSAPP_TOKEN`, `WHATSAPP_PHONE_NUMBER_ID`, `WHATSAPP_TEMPLATE_NAME` and optionally `WHATSAPP_TEMPLATE_LANGUAGE`. The named Meta WhatsApp Business **approved template** must have exactly four body parameters: `{{1}} name`, `{{2}} date`, `{{3}} time`, `{{4}} reference`. The application submits a template message after an appointment is saved and logs `submitted` / `failed` / `not_configured`; **submitted is not delivered**. Configure webhook-based delivery/status monitoring, retry queue and template acceptance with a WhatsApp Business provider before relying on automated notifications. A live WhatsApp Business account and approved customer messaging templates are not included in this package. Do not put the token into browser code.

### Required before accepting real customer data

1. Provide the legal company name, privacy contact and business contact details; update the privacy notice with retention and data-rights processes appropriate to Indian law. Obtain legal review of consent wording and communications rules.
2. Configure HTTPS/domain, privacy/cookie policies if needed, backups and restore drills, monitoring, network-based abuse protection and a durable encrypted/managed database. SQLite works for one server; use PostgreSQL for multiple application replicas.
3. Define operational ownership of appointment confirmation and cancellations. Verify staff coverage, physical store address, opening hours and capacity. Current slots are daily Mon–Sat, 10:30–18:00 IST, future 14-day window, **one request per slot per consultation mode across the whole business**. Adjust for actual locations and staff before go-live.
4. Configure and verify WhatsApp Business approved templates, sender identity and end-to-end recipient delivery. Without configuration, the site still accepts booking requests but does not send WhatsApp.
5. Run external security, accessibility and load testing against the actual deployed environment. No software can be guaranteed bug-free by local tests alone.
6. Confirm rights to use all brand images and review every customer-facing claim, service offering and franchise statement.

### Tests

```bash
pip install pytest httpx
pytest -q
```

Tests cover homepage/health, saving a booking, duplicate-slot prevention, validation, consent, admin access and CSV export. The frontend JS is also syntax checked separately.
