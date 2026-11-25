# Darzaan production deployment

Overview for **43.204.158.44**: Nginx terminates TLS; API runs in Docker; staff and marketing apps are static `dist/` on disk. Nginx details: [nginx/README.md](nginx/README.md).

## Hostnames

| URL | Content |
| --- | --- |
| https://darzaan.com | `marketing_website/dist` → `/var/www/darzaan/www` |
| https://app.darzaan.com | `web/dist` → `/var/www/darzaan/app` |
| https://api.darzaan.com | Gateway → Docker `127.0.0.1:3000` |

## Docker Compose: always merge files

The repo splits Compose on purpose:

| File | Defines |
| --- | --- |
| `api/docker-compose.yml` | **Infra:** redis, kafka, kafka-ui, jaeger, otel-collector |
| `api/docker-compose.apps.yml` | **Apps:** migrate, api-gateway, auth, core, notification, worker |
| `api/docker-compose.production.yml` | Production `env_file`, gateway `127.0.0.1:3000:3000` |

**Do not run a single file alone.** `docker-compose.apps.yml` references services named `redis` and `kafka` that exist only in `docker-compose.yml`. Running only `docker-compose.apps.yml` fails with:

```text
service "api-gateway" depends on undefined service "redis": invalid compose project
```

### Production (VPS)

From `api/`, with `.env.production` configured:

```bash
npm run compose:production
```

Equivalent:

```bash
docker compose \
  --env-file .env.production \
  -f docker-compose.yml \
  -f docker-compose.apps.yml \
  -f docker-compose.production.yml \
  up -d --build
```

One command starts infra **and** apps (including migrate). You do not need a separate `docker compose -f docker-compose.yml up -d` first.

### Development / staging

```bash
npm run compose:dev      # .env.development
npm run compose:staging  # .env.staging
```

### Infra only (API on the host)

When you run `npm run dev` on the machine and only need Redis/Kafka in Docker:

```bash
cd api
npm run compose:infra
```

## API env on the server

```bash
cd api
cp .env.production.example .env.production
```

Set `JWT_SECRET`, database URLs (Postgres on `43.204.158.44`), mail, and `CORS_ORIGINS` for `https://app.darzaan.com`, `https://darzaan.com`, and `https://www.darzaan.com`. Use `REDIS_URL=redis://redis:6379` and `KAFKA_BROKERS=kafka:29092` when using compose.

After `up`, wait for the **migrate** one-shot to finish, then check:

```bash
curl -sS http://127.0.0.1:3000/health/live
```

## Frontends

Build locally or in CI with `.env.production` (`VITE_API_URL=https://api.darzaan.com`), then rsync — see [nginx/README.md](nginx/README.md).

## Smoke tests

- `curl -I https://api.darzaan.com/health/live`
- https://app.darzaan.com — staff login, API calls to `api.darzaan.com`
- https://darzaan.com — appointment / franchise forms (CORS). Marketing build must use `VITE_API_URL=https://api.darzaan.com`; nginx on `darzaan.com` also proxies `/api/` to the gateway as a fallback.