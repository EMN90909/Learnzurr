# Architecture

Frontend SvelteKit calls the Go API through `src/lib/api.ts`. Nginx proxies `/api/*` to `cmd/api/routes.go`. The API delegates to engine packages and jobs are queued through Redis Streams for worker dispatch.
