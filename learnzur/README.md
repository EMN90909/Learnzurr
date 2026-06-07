# Learnzur

Learnzur is the SvelteKit + Go + Supabase + Redis transformation target for the Struta fork. This subtree is intentionally separated from the original Struta source while migration analysis is reviewed.

## Run locally with Docker

```bash
cd learnzur/docker
docker compose up --build
```

Open `http://localhost:8088`.

## Run backend checks

```bash
cd learnzur/backend
go test ./...
```

## Current status

- Struta architecture and migration mapping documented.
- SvelteKit route skeleton created for public, auth, teacher, parent, learner, and admin areas.
- Go auth/API/worker skeleton created with the requested endpoint surface.
- Docker Compose added for frontend, API, auth, worker, Redis, and Nginx.
- Supabase migration set generated as runnable first-pass Learnzur schema foundation with RLS enabled.
