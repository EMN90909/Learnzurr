# Struta

Funeral ecosystem for bereaved families, funeral homes, and vendors.

## Quick start

```bash
pnpm install
cp .env.example .env.local
# Fill Supabase + DATABASE_URL in .env.local

pnpm db:migrate          # Apply SQL migrations (no Supabase paste)
pnpm vapid:generate      # Web push keys (free, no signup)
pnpm logo:crop           # Optional: crop logo to icon only

pnpm dev                 # Starts Vite + API server together
```

Open http://localhost:8080

## Environment

| Variable | Purpose |
|----------|---------|
| `DATABASE_URL` | Postgres URI for `pnpm db:migrate` |
| `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` | Frontend |
| `SUPABASE_SERVICE_ROLE_KEY` | Backend admin |
| `VAPID_PUBLIC_KEY` / `VAPID_PRIVATE_KEY` / `VAPID_EMAIL` | Device push notifications |
| `VITE_PAYPAL_CLIENT_ID` | PayPal checkout |

## Push notifications

Uses `web-push` + service worker `public/push-sw.js`. No Firebase.

1. Run `pnpm vapid:generate`
2. Add keys to `.env.local`
3. Run `pnpm dev` (API must be running on port 8081)
4. Click **Enable Notifications** in the portal

## Deploy

- Render: `render.yaml`
- Docker: `Dockerfile` runs migrations then `pnpm start`
- Oracle: `oracle.yaml` / `oracle.json`
