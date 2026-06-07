# Learnzur Frontend + Backend Summary

## Frontend

- `frontend/package.json` — SvelteKit/TypeScript dependencies and scripts, including Supabase realtime client dependency.
- `frontend/svelte.config.js` — SvelteKit SSR build configuration using the Node adapter.
- `frontend/vite.config.ts` — Vite build optimization and chunking configuration.
- `frontend/tsconfig.json` — TypeScript compiler configuration.
- `frontend/src/app.html` — HTML shell used by SvelteKit SSR.
- `frontend/src/+layout.svelte` and `frontend/src/routes/+layout.svelte` — global layout wrappers for page rendering.
- `frontend/src/service-worker.ts` — offline/cache support boundary.
- `frontend/src/lib/api.ts` — single frontend REST client; all browser API calls go through this file and include memory access token, CSRF header, and cookie credentials.
- `frontend/src/lib/realtime.ts` — Supabase realtime subscriptions for public projects, comments, classroom chat, board events, notifications, and flag sandbox updates.
- `frontend/src/lib/stores.ts` — Svelte stores for current user, theme, sidebar state, notifications, and realtime events.
- `frontend/src/lib/types.ts` — shared TypeScript types for users, sessions, projects, dashboards, and API results.
- `frontend/src/lib/utils.ts` — browser-safe helpers for validation, formatting, debounce/throttle, and small UI utilities.
- `frontend/src/lib/classroom/*` — frontend classroom helpers for WebRTC boundaries and whiteboard board events.
- `frontend/src/lib/components/*` — reusable UI components, including hCaptcha, OTP email card, Studio launcher, creation studio, and project explorer.
- `frontend/src/lib/creation/tools.ts` — age-adaptive Studio tools for animation, video, beats, games, website/app, and ultra-light graphic design.
- `frontend/src/routes/(public)/*` — public landing, about, contact, Explore, and SEO class detail routes.
- `frontend/src/routes/(auth)/*` — login, forgot password, reset password, and parent/teacher-organization registration flows with hCaptcha and OTP UI.
- `frontend/src/routes/(teacher)/*` — teacher dashboard, profile, classes, LMS, timetable, classroom, meetings, earnings, payouts, Lanmat, messages, notifications, and settings pages.
- `frontend/src/routes/(learner)/*` — learner dashboard, library, classroom, tasks, Studio/Create, Explore, Lanmat, Gamfy, contests, chat, meetings, notifications, and settings pages.
- `frontend/src/routes/(parent)/*` — parent dashboard, children management, progress, classes, payments, results, messages, chat monitor, notifications, and settings pages.
- `frontend/src/routes/(admin)/*` — admin dashboard and management pages for users, classes, Mearn, Lanmat, Flag, Gamfy, contests, events, sponsors, NGOs, Find, Media, Security, Notifications, Help, and Settings.

## Backend

- `backend/go.mod` and `backend/go.sum` — Golang module definition and dependency lock boundary.
- `backend/cmd/api/main.go` — starts the Learnzur API server.
- `backend/cmd/api/server.go` — HTTP server configuration with timeouts, body limits, and port configuration.
- `backend/cmd/api/routes.go` — central REST routing layer; it maps frontend API calls to auth, admin, classroom, media, San, Find, Lanmat, Flag, Mearn, Notify, and engine health handlers.
- `backend/cmd/auth/*.go` — auth flows for login, PIN login, signup, OTP, password reset, session refresh, logout, logout-all, CSRF, hCaptcha, and secure cookie sessions.
- `backend/cmd/worker/*` — background worker and dispatcher for Redis-style jobs such as email, push, media encoding, PDF generation, flag scans, payouts, and Gamfy points.
- `backend/internal/supabase/client.go` — Supabase REST client used for auth verification, admin access, backend reads, writes, and Supabase-backed data access.
- `backend/internal/middleware/*` — auth, role guards, rate limiting, compression, CORS, logging, recovery, and security headers.
- `backend/internal/security/*` — validation, sanitization, password hashing, token signing, encryption, audit, blacklist, and fraud helpers.
- `backend/internal/cache/*` — Redis-style namespaced cache boundary; implemented safely for local operation and engine isolation.
- `backend/internal/queue/*` — Redis Streams-style producer/consumer/stream name boundaries.
- `backend/internal/db/*` — PostgreSQL pool/config/query boundary for Supabase/Postgres integration.
- `backend/internal/performance/*` — optimization helpers for JSON streaming, string builders, buffer pools, request limits, in-memory cache, and performance rules.
- `backend/engines/gamfy/*` — rewards, points, badges, streaks, age-adaptive configuration, leaderboard security, jobs, RPC, cache, and speed rules.
- `backend/engines/mearn/*` — M-Pesa/Daraja payments, transaction splits, teacher earnings, payouts, treasury, fraud checks, jobs, RPC, cache, and speed rules.
- `backend/engines/lms/*` — quizzes, tests, assignments, submissions, grading, gradebook, progress, reminders, jobs, RPC, cache, and security rules.
- `backend/engines/classroom/*` — live class rooms, WebRTC boundary, realtime board, chat, attendance, meetings, recordings, reconnects, Redis state, jobs, RPC, cache, security, and speed rules.
- `backend/engines/san/*` — coding sandbox, project saving/running/publishing, game project logic, Docker execution boundary, sanitization, jobs, RPC, cache, and security rules.
- `backend/engines/lanmat/*` — marketplace listings, purchases, approvals, royalties, parent approval, moderation, jobs, RPC, cache, and security rules.
- `backend/engines/notify/*` — Resend email, VAPID push, reminders, notification preferences, templates, jobs, RPC, cache, and delivery security.
- `backend/engines/media/*` — uploads, video/animation/movie rendering, PDFs, certificates, storage, signed URLs, jobs, RPC, cache, and media security.
- `backend/engines/find/*` — search, public Explore, SSR class SEO data, search suggestions, analytics, cache, RPC, and search security.
- `backend/engines/flag/*` — AI/rule moderation, Gemini/OpenRouter/DeepSeek provider boundaries, chat sandbox, strikes, appeals, jobs, RPC, cache, and safety rules.
