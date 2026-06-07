# Learnzur Architecture Study and Target Design

## Struta source study notes

This repository is a Struta funeral-operations web app with a React/Vite codebase plus a small Next.js shell. The root `package.json` names the product `struta-funeral-ecosystem`, runs `next dev` and `tsx server/index.ts` together, and currently builds with `next build`. The React/Vite app still exists under `src/` and is routed with `react-router-dom` from `src/App.tsx`.

### Frontend folders inspected

| Folder/file | What exists in Struta | Reuse decision for Learnzur |
|---|---|---|
| `app/` | Minimal Next.js layout/page shell. | Replace with SvelteKit. Do not carry Next.js routing forward. |
| `src/App.tsx` | Central React router. Lazy-loads public pages, auth pages, family/bereaved pages, funeral home operations pages, marketplace/vendor pages, manager ERP pages, staff pages, admin pages, memorial pages, invitation claims. | Use only as route inventory. Replace with SvelteKit route files. |
| `src/components/ui/` | shadcn/Radix React component primitives. | Visual patterns reusable conceptually only; code is React and must be replaced. |
| `src/components/auth/AuthProvider.tsx` | Supabase session provider, profile lookup, role mapping, localStorage-backed preferences and staff sessions. | Reuse concepts: profile hydration, role guards. Replace storage model because Learnzur forbids auth tokens in localStorage. |
| `src/features/bereaved/` | Family/bereaved dashboard: dashboard, search, requests, chats, memorials, settings, signup. | Map to learner only after replacing all funeral concepts. |
| `src/features/funeral-home/` | Operations/home dashboard: cases, inventory, billing, schedule, settings, signup. | Map to parent only where oversight/payment concepts survive; remove funeral case/inventory language. |
| `src/features/marketplace/` | Vendor dashboard: catalog, orders, inventory, billing/settings/signup. | Map vendor to teacher/Lanmat only after replacing products with classes/materials. |
| `src/features/admin/` and `src/features/erp/` | Admin, reports, payments, users, branches/compliance/requests. | Keep admin role boundary concepts; rebuild pages for Learnzur. |
| `src/pages/` | Public pages: landing, about, contact, help, pricing, legal, payment success/error. | Rebuild copy and routes in SvelteKit. |

### Backend/server folders inspected

| Folder/file | What exists in Struta | Reuse decision for Learnzur |
|---|---|---|
| `server/index.ts` | Express REST API registration with security middleware, rate limiting, auth/admin routes, production routes, payment routes, PayPal/Paystack/Stripe routes, realtime and push support. | Preserve concepts: centralized API registration, safe middleware, rate limits. Rewrite in Go per target. |
| `server/auth.ts` | Extracts Bearer token, validates with Supabase Admin, loads `user_profiles`, maps configured admins. | Reuse JWT/Supabase profile pattern in Go. |
| `server/security.ts` and `server/security/*` | Request security, permissions, and hardening helpers. | Reuse as requirements list; reimplement in Go middleware. |
| `server/routes/paymentRequestRoutes.ts` | Manual subscription payment request endpoint, Supabase inserts, notification emission. | Reusable only as payment-audit pattern. It is not Daraja STK Push. |
| `server/routes/paypal*`, `paystack*`, `stripe*` | Non-M-Pesa payment providers and webhook handling. | Delete or isolate. Learnzur needs M-Pesa Daraja/Mearn ledger. |
| `server/push-server/*` | Web push subscription and VAPID route support. | Reuse concept in Notify engine. |
| `server/realtime/realtimeHub.ts` | WebSocket/realtime notification hub. | Reuse concept for notifications/classroom status, not code. |

### Go services inspected

`go-services/family-ai-service` and `go-services/smtp-mailer` are independent service experiments. They are not the requested `cmd/` Go backend layout. Learnzur should create a new `backend/cmd` tree and may later port SMTP ideas into Notify.

### Supabase inspected

`supabase/migrations` contains Struta schema evolution for memorial pages, funeral operations, provider/staff ERP, push subscriptions, payment requests, admin functions, RLS, security gates, moderation, and performance indexes. Existing table names are funeral-specific (`memorials`, `service_requests`, `funeral_home_inventory`, ERP cases) and should not be renamed blindly; Learnzur needs new education-first tables with RLS.

### Payments finding

The source contains PayPal, Paystack, Stripe, manual/mobile-money fields, and `mpesa_phone` profile fields. I did not find a production Daraja STK Push callback implementation in the inspected source. Therefore Mearn must implement Daraja deliberately instead of assuming Struta has it.

## Target Learnzur architecture

Learnzur is split into:

- `frontend/`: SvelteKit TypeScript app; mobile-first routes, Svelte stores, memory-held access token plus secure refresh cookies.
- `backend/`: Go REST API and isolated services. `cmd/api` is the aggregate API, `cmd/auth` owns auth endpoints, `cmd/worker` processes Redis jobs, and `cmd/engines` can launch engine services.
- `backend/engines/*`: Gamfy, Mearn, LMS, Classroom, San, Lanmat, Notify, Media, Find. Each has a boundary document, Redis namespace, DB pool expectation, failure mode, and independent health endpoint.
- `supabase/migrations`: ordered Learnzur schema foundation with RLS enabled.
- `docker/`: compose and Dockerfiles for backend, SvelteKit frontend, Redis, Nginx, and sandbox image.

## What works and should be preserved as patterns

- Supabase Admin JWT validation + profile hydration.
- Centralized route registration and rate limiting.
- RLS-first schema discipline.
- Push/VAPID notification concept.
- Admin audit and moderation concepts.
- Deployment artifacts for containerized hosting.

## What must change

- Replace Next.js/React frontend with SvelteKit.
- Replace funeral roles with learner/teacher/parent/admin.
- Replace memorials, funeral cases, homes, vehicles, embalmer/coordinator staff flows with education/LMS/classroom flows.
- Replace PayPal/Stripe/Paystack-first billing with Mearn ledger and M-Pesa Daraja-first payment flows.
- Remove localStorage auth token/session coupling.
