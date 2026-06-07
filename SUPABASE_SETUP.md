# Supabase Setup Guide for Struta

This guide explains how to properly configure Supabase credentials for both local development and production deployment.

## Understanding Vite Environment Variables

Vite uses a specific naming convention for client-side environment variables:

- **`VITE_*` variables** → Automatically exposed to client-side code
- **Non-prefixed variables** → Only accessible on the server/build process
- **`NEXT_PUBLIC_*` variables** → Alternative naming (Next.js style, also works with Vite)

## Why We Use `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`

The Supabase client needs to be initialized on the client-side, so credentials MUST use the `VITE_` prefix. Without this prefix, `import.meta.env.VITE_SUPABASE_URL` will be undefined at runtime.

### Credential Types

1. **Client-side (Anon Key)**
   - Used in: Browser client
   - Environment variables: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`
   - Permissions: Limited to anonymous/authenticated user operations
   - Safe to expose in client code

2. **Server-side (Service Role Key)**
   - Used in: Backend server only
   - Environment variables: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`
   - Permissions: Full admin access
   - NEVER expose in client code

## Local Development Setup

### Step 1: Get Your Supabase Credentials

1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Select your project
3. Go to **Settings** → **API**
4. Copy:
   - **Project URL** (for `VITE_SUPABASE_URL`)
   - **Anon public key** (for `VITE_SUPABASE_ANON_KEY`)
   - **Service role key** (for `SUPABASE_SERVICE_ROLE_KEY`)

### Step 2: Update `.env` File

Create or update `.env` in the project root:

```env
# Client-side (MUST use VITE_ prefix)
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here

# Server-side (for backend operations)
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
```

### Step 3: Start Development Server

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

Vite will automatically:
1. Load `.env` file
2. Expose `VITE_*` variables to `import.meta.env`
3. Make them available to client-side code

## Production Deployment on Render, Vercel, or Netlify

### For Render:

1. Go to your Render service dashboard
2. Navigate to **Environment** tab
3. Add these environment variables:

```
VITE_SUPABASE_URL = https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY = your-anon-key-here
SUPABASE_URL = https://your-project-id.supabase.co
SUPABASE_SERVICE_ROLE_KEY = your-service-role-key-here
```

4. Save and trigger a redeploy

### For Vercel:

1. Go to your Vercel project settings
2. Navigate to **Environment Variables**
3. Add the same variables (Vercel automatically exposes `VITE_*` variables)

### For Netlify:

1. Go to **Site settings** → **Build & deploy** → **Environment**
2. Add the environment variables
3. Trigger a redeploy

## Testing Your Setup

### Local Testing

1. Start dev server: `npm run dev`
2. Open browser console (F12)
3. Check for warning message in console:
   - ✓ No errors = Credentials loaded correctly
   - ✗ Error message = Check variable names and values

### Production Testing

1. Deploy to Render/Vercel/Netlify
2. Open your deployed site
3. Open browser DevTools (F12)
4. Check console for:
   - ✓ No "[Supabase Client] Missing or invalid" warnings = Success
   - ✗ Warning present = Re-check environment variables

## Common Errors and Solutions

### Error: "Missing or invalid Supabase credentials"

**Causes:**
- Environment variables not set in deployment platform
- Variables are missing `VITE_` prefix
- Keys are empty or have placeholder values

**Solution:**
1. Verify variable names in deployment platform match exactly:
   - `VITE_SUPABASE_URL` (not `SUPABASE_URL` for client)
   - `VITE_SUPABASE_ANON_KEY` (not `SUPABASE_ANON_KEY` for client)
2. Verify values are not placeholders like "your-supabase-url"
3. Restart/redeploy after adding variables

### Error: "supabaseUrl is required"

This means the client couldn't initialize because credentials are missing.

**Solution:**
1. Check that `VITE_` prefixed variables are set
2. Check that values are valid (not empty)
3. Check browser console for the detailed warning message

### Local `.env` Not Working

**Solution:**
1. Clear Vite cache: `rm -rf .vite`
2. Restart dev server: Stop and `npm run dev` again
3. Verify `.env` file is in project root (not in src/)

## File Changes for This Fix

The following files were updated to support proper Supabase initialization:

1. **`.env`** - Added `VITE_` prefixed variables
2. **`vite.config.ts`** - Updated to prioritize and expose `VITE_*` variables
3. **`src/vite-env.d.ts`** - Added TypeScript types for environment variables
4. **`src/integrations/supabase/client.ts`** - Updated to read `VITE_*` variables
5. **`.env.example`** - Updated with correct format

## References

- [Vite Environment Variables Documentation](https://vitejs.dev/guide/env-and-modes.html)
- [Supabase JavaScript Client Docs](https://supabase.com/docs/reference/javascript/introduction)
- [Render Environment Variables](https://render.com/docs/configure-environment-variables)
