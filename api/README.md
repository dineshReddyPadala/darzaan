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

## Local setup

```bash
cd api
cp .env.example .env
npm install
npm run prisma:generate
npm run seed:export
```

Apply migrations and seed once Postgres, Redis, and Kafka are up:

```bash
docker compose up -d postgres redis kafka
npm run prisma:migrate
npm run seed
npm run start:dev
```

Staff password for every seeded account is `Darzaan#2026`. Addresses are in `libs/common/src/roles.ts`, for example `aditi.malhotra@darzaan.test`.

`npm test` runs unit tests without Docker. The order integration test runs only when `CORE_DATABASE_URL` points at a migrated database.

## Docker

```bash
docker compose up --build
```

That starts Postgres, Redis, Kafka (KRaft), Kafka UI on port 8080, Jaeger on port 16686, the OpenTelemetry collector, migrations, seed, and the five processes. The gateway is on port 3000.

Set `OTEL_ENABLED=true` to export traces. Logs are JSON from Pino.

## Production build

```bash
npm run build
npm run start:gateway
```

The other processes use `npm run start:auth`, `start:core`, `start:notification`, and `start:worker`.

## AWS shape

Run each process as its own ECS Fargate service. Put only the gateway behind the load balancer. Use RDS for the three databases, ElastiCache for Redis, and Amazon MSK for Kafka. Keep `JWT_SECRET` and the database URLs in Secrets Manager.

## Forms and keys

Request bodies for orders and customers are the same objects the screens already build. Field names are not renamed. Workshop roles do not receive prices, payments, or customer contacts, and a save from those roles cannot clear the stored values.
