# dotenvx Environment Configuration Guide

## Overview

This project uses **@dotenvx/dotenvx** for encrypted environment variable management. This allows you to securely commit `.env.keys` to git while keeping `.env` values encrypted.

## Installation & Setup

### 1. Install dotenvx CLI (Local Development)

```bash
npm install -g @dotenvx/dotenvx
# or
brew install dotenvx
```

### 2. Initialize dotenvx in your project (already done)

The project already has `@dotenvx/dotenvx` installed as a dependency.

## Environment Variable Loading

### Build Time (Vite)
```typescript
// vite.config.ts
import '@dotenvx/dotenvx';  // Loads encrypted .env
import dotenv from "dotenv";
dotenv.config();  // Fallback for local dev
```

The vite build will:
1. Load encrypted `.env` file via dotenvx
2. Read `VITE_*` prefixed variables
3. Inject them into the client-side build

### Runtime (Server)
```typescript
// server/index.ts
import '@dotenvx/dotenvx';  // Loads encrypted .env
dotenv.config();  // Fallback for local dev
```

Server-side code accesses variables via `process.env`:
- `process.env.VITE_SUPABASE_URL`
- `process.env.SUPABASE_URL`
- `process.env.PAYPAL_SECRET_KEY`
- etc.

## Working with Encrypted .env

### Create Encrypted Environment Variables

**Local Development:**
```bash
# Set individual variables
dotenvx set VITE_SUPABASE_URL "https://your-project.supabase.co"
dotenvx set VITE_SUPABASE_ANON_KEY "your-anon-key"

# Or use the UI
dotenvx ui
```

### View Encrypted Variables
```bash
# Decrypt and view (requires .env.keys)
dotenvx get VITE_SUPABASE_URL

# View all
dotenvx list
```

### Files Generated
- `.env.keys` - Encryption keys (keep private, add to .gitignore)
- `.env` - Encrypted values (can be committed to git)

## Render Deployment Configuration

### Option 1: Provide .env.keys to Render (Recommended)

1. **Copy your `.env.keys` file locally first:**
   ```bash
   cat .env.keys
   ```

2. **In Render Dashboard → Environment:**
   - Add: `DOTENVX_KEYS=<your-encryption-keys>`
   - Add: `DOTENVX_PRIVATE_KEY_FALLBACK=<if-using-fallback>`

3. **Add your actual secret values:**
   ```
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key
   SUPABASE_URL=https://your-project.supabase.co
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   PAYPAL_SECRET_KEY=your-paypal-secret
   SMTP_USER=your-email
   SMTP_PASS=your-password
   ```

### Option 2: Set All Variables in Render Dashboard (No .env needed)

Skip the encrypted .env file and just set environment variables directly in Render:

**In Render Dashboard → Service → Environment:**
```
VITE_SUPABASE_URL=your-value
VITE_SUPABASE_ANON_KEY=your-value
VITE_PAYPAL_CLIENT_ID=your-value
SUPABASE_URL=your-value
SUPABASE_SERVICE_ROLE_KEY=your-value
PAYPAL_SECRET_KEY=your-value
SMTP_HOST=smtp-relay.brevo.com
SMTP_PORT=587
SMTP_USER=your-email
SMTP_PASS=your-password
SMTP_FROM=noreply@struta.io
SMTP_FROM_NAME=Struta
APP_URL=https://struta.onrender.com
PORT=10000
```

## Debugging Environment Variables

### Check what's loaded in build
Look for this in your build output:
```
[Vite] Loaded X environment variables
```

### Check what's loaded at runtime
On Render, check the logs:
```
◇ injected env (X) from .env
```

Should show X > 0.

### Verify variables are accessible
```bash
# In server code
console.log(process.env.VITE_SUPABASE_URL);

# In client code
console.log(import.meta.env.VITE_SUPABASE_URL);
```

## Troubleshooting

### "injected env (0)" - Variables Not Loading

**Cause:** Environment variables not properly set or encrypted keys not found.

**Solutions:**
1. Check Render Environment variables are set correctly
2. Verify `.env.keys` is accessible or DOTENVX_KEYS is set in Render
3. Check `.env` file syntax
4. Ensure VITE_* prefix for client-side variables

### Build fails with "Cannot read properties of undefined"

**Cause:** Variables not loaded during build time.

**Solution:**
1. Ensure `import '@dotenvx/dotenvx'` is at the very top of vite.config.ts
2. Variables must be set before the build starts
3. On Render, set variables in Environment BEFORE triggering a redeploy

### Variables not available in TypeScript

**Cause:** Missing type definitions.

**Solution:** Check `src/vite-env.d.ts` has proper types:
```typescript
interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string;
  readonly VITE_SUPABASE_ANON_KEY: string;
}
```

## Security Best Practices

1. **Never commit `.env.keys` to git** - Add to `.gitignore`
2. **Keep `.env.keys` locally** - Only share via secure channels
3. **Use Render's environment settings** - Don't copy secrets into Dockerfile
4. **Rotate secrets regularly** - Especially API keys and passwords
5. **Use different credentials per environment** - Dev/Staging/Production
6. **Don't log sensitive values** - Remove debug logs before deployment

## Additional Resources

- [dotenvx Documentation](https://www.dotenvx.com/)
- [dotenvx CLI Reference](https://www.dotenvx.com/cli)
- [Render Environment Variables](https://render.com/docs/environment-variables)
