# Learnzurr

Learnzurr is now a full-stack TypeScript learning platform.

## Active stack

- React 18 frontend
- Vite development and production build
- Express 5 + Node.js TypeScript backend
- Paystack transaction initialization, verification, and signed webhooks

The root application is the only supported build and deployment path. The previous Go module and Svelte package/build entrypoints were removed. Existing Supabase migrations and related infrastructure were intentionally left untouched.

## Development

```bash
npm install
cp .env.example .env
npm run dev
```

- Web: `http://localhost:5173`
- API: `http://localhost:8081`

## Paystack

Set `PAYSTACK_SECRET_KEY` only on the Express server. Never expose the secret through a `VITE_` variable or browser code.

The backend provides:

- `POST /api/payments/initialize`
- `GET /api/payments/verify/:reference`
- `POST /api/payments/webhook`
- `GET /api/health`

Amounts entered in the UI are converted to currency subunits before Paystack initialization. Webhooks are validated using the `x-paystack-signature` HMAC-SHA512 signature.

## Production

```bash
npm run build
npm start
```

Express serves the compiled Vite SPA and all `/api/*` routes from one Node.js process. The included Dockerfile builds and runs that same stack.
