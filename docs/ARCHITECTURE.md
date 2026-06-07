# Learnzur Architecture

The uploaded school-dashboard fork was inspected before transformation. It contained 338 files, dashboard folders ['src/dashboards/Parents', 'src/dashboards/Teachers', 'src/dashboards/learners', 'src/dashboards/Admin'], 64 Supabase migrations, a React/Vite frontend, an Express/TypeScript API server, and small Go services.

Learnzur replaces the product layer with SvelteKit + TypeScript and a Golang backend while preserving the architectural intent: dashboards, Supabase, payments, auth boundaries, Docker deployment, and service separation.

## Communication rules

- SvelteKit calls `frontend/src/lib/api.ts` only.
- Nginx routes `/api/*` to `backend/cmd/api/routes.go`.
- Engines communicate by internal service boundaries and Redis Streams.
- Async work enters Redis Streams and is consumed by `cmd/worker/dispatcher.go`.
- JWTs stay in memory on the frontend and are sent by Authorization header.
