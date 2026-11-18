# Darzaan API

NestJS services for the tailoring workspace. The HTTP edge is the gateway. Auth, orders, and notifications each have their own Postgres database. Domain events go through a transactional outbox to Kafka.

## Services

| Process | Port | Role |
| --- | --- | --- |
| api-gateway | 3000 | CORS, rate limit, JWT check, routing |
| auth-service | 3001 | Passwords, access tokens, refresh rotation |
| core-service | 3002 | Customers, orders, production, QC, store, logistics |
| notification-service | 3003 | In-app alerts and the message log |
| worker | 3004 | Outbox relay, retry timing, cleanup |

Swagger for a process is at `http://localhost:<port>/docs`. The gateway is the URL the browser uses.

## Environments

Three env files (gitignored) are loaded by `scripts/load-env.mjs` using `DARZAAN_ENV` (`development` | `staging` | `production`, default `development`):

| Template | Local copy |
| --- | --- |
| `.env.development.example` | `.env.development` |
| `.env.staging.example` | `.env.staging` |
| `.env.production.example` | `.env.production` |

Legacy `cp .env.example .env` still works; prefer `.env.development` for new setups. Database URLs always come from the env file—compose does not embed credentials.

## Local setup

```bash
cd api
cp .env.development.example .env.development
npm install
npm run prisma:generate
npm run seed:export
```

Point the three `*_DATABASE_URL` values at reachable Postgres instances. Start Redis and Kafka (local or Docker infra only):

```bash
docker compose up -d redis kafka
npm run prisma:migrate
npm run seed
npm run dev
```

`npm run dev` is the same as `npm run start:dev`. For another env file on the host:

```bash
npm run start:dev:staging
```

Staff password for every seeded account is `Darzaan#2026`. Addresses are in `libs/common/src/roles.ts`, for example `aditi.malhotra@darzaan.test`.

`npm test` runs unit tests without Docker. The order integration test runs only when `CORE_DATABASE_URL` points at a migrated database.

## Docker

Infra only (Redis, Kafka, Kafka UI, Jaeger, OTEL):

```bash
docker compose up -d
```

Full stack for an environment (migrations, seed, five API processes). Copy and fill the matching env file first:

```bash
cp .env.development.example .env.development
npm run compose:dev
```

Staging and production:

```bash
cp .env.staging.example .env.staging
npm run compose:staging
```

```bash
cp .env.production.example .env.production
npm run compose:production
```

Compose files: `docker-compose.yml` (infra), `docker-compose.apps.yml` (API services), plus `docker-compose.development.yml`, `.staging.yml`, or `.production.yml` for `env_file`.

**Production** (`compose:production`) runs API services only. The gateway binds to `127.0.0.1:3000`. Staff and marketing sites are static `dist/` behind host Nginx — see [deploy/nginx/README.md](../deploy/nginx/README.md).

Production hostnames:

| Host | Role |
| --- | --- |
| `api.darzaan.com` | Gateway (proxied from Nginx) |
| `app.darzaan.com` | Staff app (`web/dist`) |
| `darzaan.com` | Marketing site (`marketing_website/dist`) |

Set `CORS_ORIGINS` in `.env.production` to include `https://app.darzaan.com`, `https://darzaan.com`, and `https://www.darzaan.com`.

Set `OTEL_ENABLED=true` in the env file to export traces. Logs are JSON from Pino.

## Production build

```bash
npm run build
npm run start:gateway
```

Per-env gateway on the host: `npm run start:gateway:staging`, `npm run start:gateway:production`.

The other processes use `npm run start:auth`, `start:core`, `start:notification`, and `start:worker` (with `DARZAAN_ENV` set if not using `.env.development`).

## AWS shape

Run each process as its own ECS Fargate service. Put only the gateway behind the load balancer. Use RDS for the three databases, ElastiCache for Redis, and Amazon MSK for Kafka. Keep `JWT_SECRET` and the database URLs in Secrets Manager.

## Forms and keys

Request bodies for orders and customers are the same objects the screens already build. Field names are not renamed. Workshop roles do not receive prices, payments, or customer contacts, and a save from those roles cannot clear the stored values.