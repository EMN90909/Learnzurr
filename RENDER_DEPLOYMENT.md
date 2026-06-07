# Render Deployment Guide - Struta

This guide explains how to deploy Struta to Render with proper environment variables.

## Quick Start

### 1. Create a Web Service on Render

1. Go to [Render Dashboard](https://dashboard.render.com)
2. Click "New +" → "Web Service"
3. Connect your GitHub repository (EMN90909/strut)
4. Select **main** branch
5. Name your service: **struta**
6. Region: Select closest to your users
7. Runtime: **Docker** (auto-detected from Dockerfile)

### 2. Set Environment Variables

In the "Environment" section, add:

```
NODE_ENV=production
PORT=10000

VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_API_BASE_URL=/api
VITE_APP_URL=https://struta.onrender.com
VITE_PAYSTACK_PUBLIC_KEY=pk_live_xxx
VITE_HCAPTCHA_SITEKEY=your-sitekey
VITE_VAPID_PUBLIC_KEY=your-vapid-public-key
VITE_ENABLE_WEB_PUSH=true

SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### 3. Deploy

Click "Create Web Service" - Render will build and deploy automatically.

## Environment Variables Explained

| Variable | Purpose | Where It's Used |
|----------|---------|-----------------|
| `VITE_SUPABASE_URL` | Frontend (client-side) | Browser, build-time injection |
| `VITE_SUPABASE_ANON_KEY` | Frontend (client-side) | Browser, build-time injection |
| `SUPABASE_URL` | Backend (server-side) | Node.js server |
| `SUPABASE_ANON_KEY` | Backend (server-side) | Node.js server |
| `SUPABASE_SERVICE_ROLE_KEY` | Backend elevated access | Node.js server (admin operations) |

**Frontend variables** (`VITE_*`) are injected during the build process and embedded in the compiled JavaScript. They must be available before `pnpm run build` starts; do not rely on a production `.env` file inside the repository.

**Backend variables** are read at runtime from `process.env`.

### Docker, Render, and Oracle/OCI builds

For Docker-based hosting, pass public client values as Docker build args as well as runtime env vars:

```
VITE_SUPABASE_URL
VITE_SUPABASE_ANON_KEY
VITE_API_BASE_URL
VITE_APP_URL
VITE_PAYSTACK_PUBLIC_KEY
VITE_HCAPTCHA_SITEKEY
VITE_VAPID_PUBLIC_KEY
VITE_ENABLE_WEB_PUSH
```

Keep private values such as `SUPABASE_SERVICE_ROLE_KEY`, payment secret keys, SMTP passwords, and hCaptcha secrets as runtime-only environment variables.

## Optional: Database Migrations

If you want to run database migrations on container start, add:

```
DATABASE_URL=postgresql://user:pass@host:5432/dbname
```

or

```
SUPABASE_DB_URL=postgresql://postgres:pass@db.project-ref.supabase.co:5432/postgres
```

If neither is set, migrations are skipped and the app continues normally.

## Getting Your Supabase Credentials

1. Go to [supabase.com](https://supabase.com)
2. Open your project
3. Settings → API
4. Copy:
   - **Project URL** → use for both `VITE_SUPABASE_URL` and `SUPABASE_URL`
   - **Anon Public Key** → use for both `VITE_SUPABASE_ANON_KEY` and `SUPABASE_ANON_KEY`
   - **Service Role Secret** → use for `SUPABASE_SERVICE_ROLE_KEY`

## Verification After Deploy

### Check Logs

Go to "Logs" and verify:
- ✅ Build completes successfully
- ✅ `pnpm db:migrate` runs (or skips if no DATABASE_URL)
- ✅ `pnpm start` shows server listening

### Test Frontend

1. Visit your app URL (e.g., `https://struta.onrender.com`)
2. Open browser Console
3. You should NOT see:
   - ❌ `supabaseUrl is required` error
   - ❌ `[Supabase Client] Missing credentials` warning

### Test Backend

In Node.js console on server, verify Supabase is configured by checking logs for successful API calls.

## Troubleshooting

### App doesn't load
- Check that `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are set
- Both must have real values (not empty strings)

### Migrations not running
- Add `DATABASE_URL` or `SUPABASE_DB_URL` if you want migrations
- Without these variables, migrations are skipped (not an error)

### Environment variables not found
- Verify they're in Render Dashboard → Environment section
- Don't put them in `.env` file - Render reads from Environment only

## What's NOT Required

You do **NOT** need:
- ❌ `SUPABASE_DB_PASSWORD` (removed, use full connection string instead)
- ❌ `.env` file (Render uses Environment variables)
- ❌ Any database credentials in Docker (all at runtime)

## Auto-Deploy on Git Push

After initial setup, any git push to `main` will trigger automatic redeploy in Render.

## Support

Check Render logs for detailed error messages. Most issues are due to missing environment variables - verify they're all set correctly in Render Dashboard.
