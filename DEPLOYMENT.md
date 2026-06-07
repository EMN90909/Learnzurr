# Deployment Guide - Struta on Render

## Environment Variables on Render

The application requires Supabase credentials to enable authentication and database features. Follow these steps to set up your environment variables on Render.

### Step 1: Get Your Supabase Credentials

1. Go to [supabase.com](https://supabase.com) and log in
2. Select your project
3. In the sidebar, go to **Settings > API**
4. Copy:
   - **Project URL** (this is your `VITE_SUPABASE_URL`)
   - **Anon public key** (this is your `VITE_SUPABASE_ANON_KEY`)

### Step 2: Add Environment Variables to Render

1. Go to [render.com](https://render.com) and navigate to your service
2. Click on the **Environment** tab
3. Add the following environment variables:

| Variable Name | Value | Source |
|---|---|---|
| `VITE_SUPABASE_URL` | Your Supabase Project URL | From Supabase Settings > API |
| `VITE_SUPABASE_ANON_KEY` | Your Supabase Anon Public Key | From Supabase Settings > API |
| `NEXT_PUBLIC_SUPABASE_URL` | Same as `VITE_SUPABASE_URL` | (for compatibility) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Same as `VITE_SUPABASE_ANON_KEY` | (for compatibility) |

### Step 3: Deploy

1. After adding the environment variables, click **Save**
2. Render will automatically redeploy your service with the new variables
3. Wait for the deployment to complete

## Local Development

For local development, create a `.env` file in the project root:

```bash
VITE_SUPABASE_URL=your-supabase-project-url
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
VITE_PAYPAL_CLIENT_ID=your-paypal-client-id
```

Never commit the `.env` file to Git.

## Troubleshooting

### "Missing or invalid Supabase credentials" Warning

If you see this warning in the browser console, it means:

1. **On Render**: Environment variables weren't set in the Render dashboard
   - Go to your service settings on Render
   - Add the environment variables in the Environment tab
   - Redeploy

2. **Locally**: The `.env` file doesn't exist or has placeholder values
   - Create a `.env` file with real credentials
   - Restart your dev server

### Service Worker Errors

The application will gracefully handle missing service workers. These warnings are non-critical and won't affect the main functionality.

## Architecture

- The application uses **Vite** as the build tool
- Environment variables are injected at build time
- The Supabase client supports both `VITE_*` and `NEXT_PUBLIC_*` variable formats
- If credentials are invalid or missing, the app runs in demo mode without authentication
