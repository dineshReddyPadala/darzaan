# Production Nginx (darzaan.com)

DNS A records pointing at **43.204.158.44**:

| Host | Purpose |
| --- | --- |
| `@` / `www` | Marketing site → `/var/www/darzaan/www` |
| `app` | Staff app → `/var/www/darzaan/app` |
| `api` | API gateway (Docker on `127.0.0.1:3000`) |

## Server layout

```text
/var/www/darzaan/www/    ← marketing_website/dist/
/var/www/darzaan/app/    ← web/dist/
/var/www/certbot/        ← ACME webroot (optional)
```

## API (Docker only)

On the VPS:

```bash
cd api
cp .env.production.example .env.production   # fill JWT, DB password, mail
npm run compose:production
```

**Important:** Never run `docker-compose.apps.yml` by itself — it depends on `redis` and `kafka` from `docker-compose.yml`. Use the merged command above or see [../PRODUCTION.md](../PRODUCTION.md).

Gateway is not exposed on the public interface; only `127.0.0.1:3000`.

## Frontends (static dist)

On your machine or CI:

```bash
cd web && npm run build
cd marketing_website && npm run build
```

Copy to the server (example):

```bash
rsync -avz --delete web/dist/ user@43.204.158.44:/var/www/darzaan/app/
rsync -avz --delete marketing_website/dist/ user@43.204.158.44:/var/www/darzaan/www/
```

Builds must use `.env.production` with `VITE_API_URL=https://api.darzaan.com`.

## Nginx + Let's Encrypt (Ubuntu)

```bash
sudo apt install nginx certbot python3-certbot-nginx
sudo mkdir -p /var/www/darzaan/app /var/www/darzaan/www /var/www/certbot
```

Copy `darzaan-http.conf` and `darzaan.conf` into `/etc/nginx/sites-available/darzaan`, enable the site, then:

```bash
sudo certbot certonly --nginx \
  -d darzaan.com -d www.darzaan.com -d app.darzaan.com -d api.darzaan.com
```

Adjust `ssl_certificate` paths in `darzaan.conf` if certbot uses a different live directory name. Test and reload:

```bash
sudo nginx -t && sudo systemctl reload nginx
```

Renewal: `sudo certbot renew` (add a cron or systemd timer on the VPS).

## Checks

- `curl -I https://api.darzaan.com/health/live`
- Staff login at `https://app.darzaan.com` (requests go to `https://api.darzaan.com`)
- Booking forms on `https://darzaan.com` (CORS allows marketing origin on the API)