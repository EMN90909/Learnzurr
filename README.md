# Learnzur

Learnzur is a Kenya-first holiday tuition platform for parents, teachers, learners and administrators. This repository follows the pasted architecture: SvelteKit frontend, Go API, Go worker, internal engine packages, Redis Streams, and one Supabase PostgreSQL database.

## Source of truth

- The frontend never talks directly to engines or the database.
- All frontend calls go through `frontend/src/lib/api.ts` and then `/api/*`.
- Nginx proxies `/api/*` to the Go API and all page traffic to SvelteKit.
- Engines expose Go packages for business logic and communicate through internal contracts. External clients do not call engines directly.
- Redis is used for cache, idempotency and streams.
- Supabase PostgreSQL is the only persistent database.
- Supabase is not used in this version.

## Run locally

```bash
cp .env.example .env
docker compose up --build
```

Open `http://localhost`.

## Test without Docker

```bash
cd backend && go test ./...
cd ../frontend && npm install && npm run check && npm run build
```

## Database

The `supabase/migrations` folder contains the table groups, policies, indexes, functions and seed data required by the API. In Docker Compose the same migration folder is mounted into the local PostgreSQL container. In Supabase hosted projects, run the files in order with the Supabase CLI.

## Production notes

Set real values in `.env`, rotate `JWT_SECRET`, use Supabase pooled connection strings, configure M-Pesa Daraja callbacks, configure SMTP and VAPID keys, and keep all service-role credentials server-only.

## Single-container deployment

This repository now includes a root `Dockerfile` for Render, Oracle Cloud, or any host that expects one container to serve the full app.

The container runs three internal processes:

- Go API on `API_PORT`, default `8080`
- SvelteKit SSR server on `FRONTEND_PORT`, default `3000`
- Node reverse proxy on public `PORT`, default `10000`

Public routing:

- `/api/*` goes to the Go backend
- `/*` goes to the SvelteKit frontend
- `/healthz` is the deployment health check

Build and run locally:

```bash
docker build -t learnzur:latest .
docker run --rm --env-file .env -e PORT=10000 -p 10000:10000 learnzur:latest
```

Open `http://localhost:10000`.

## Render deployment

Use `render.yaml`. Set these secret environment variables in Render:

- `DATABASE_URL`
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `JWT_SECRET`
- M-Pesa and SMTP variables when ready

Render will build the root `Dockerfile`. The web service uses `/healthz` as the health check.

## Oracle Cloud deployment

Use `oracle.yaml` as the deployment runbook. It documents the recommended OCI VM shape, ingress ports, required environment variables, and exact Docker commands.
