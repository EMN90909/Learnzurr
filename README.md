# Learnzur

Learnzur is a Kenyan online holiday tuition platform for parents, teachers, learners, and administrators. The app uses a SvelteKit + TypeScript frontend, a Golang backend, Supabase PostgreSQL, Redis Streams, Nginx, Docker, and isolated Golang engines.

## Architecture rule

Frontend calls only `frontend/src/lib/api.ts`. Requests pass through Nginx to `backend/cmd/api/routes.go`. Engines communicate internally through Protobuf-style service boundaries and shared Redis/PostgreSQL infrastructure.

## Run locally with Docker

```bash
cp .env.example .env
docker compose up --build
```

Open:

```txt
http://localhost:8080
```

## Run backend tests

```bash
cd backend
go test ./...
go build ./cmd/api
```

## Run frontend locally

```bash
cd frontend
npm install
npm run dev -- --host 0.0.0.0
```

## Main routes

- `/` landing page
- `/login`
- `/register`, `/register/parent`, `/register/teacher`, `/register/organization`
- `/teacher/dashboard`
- `/learner/dashboard`
- `/parent/dashboard`
- `/admin/dashboard`

Role prefixes are used because SvelteKit route groups are layout-only and duplicate `/dashboard` pages would collide during build.


## Single Dockerfile runtime

The root `Dockerfile` builds the SvelteKit SSR frontend and the Golang API, then runs both behind Nginx inside one container. Use it when you want one command to launch the complete web app shell:

```bash
docker build -t learnzur .
docker run --env-file .env -p 8080:80 learnzur
```

The root `docker-compose.yml` uses that same image and adds Redis and PostgreSQL services for the shared cache, queues, and Supabase-compatible database development flow.

## SSR and SEO

SvelteKit SSR is enabled through `@sveltejs/adapter-node`. Public pages and class detail pages expose metadata from `+page.ts` and the shared `src/routes/+layout.svelte` head block so Learnzur can be indexed as a Kenyan education platform.


## Learner Creation Studio

Animation creation includes simple mode for ages 8-12 and advanced mode for ages 13-18, covering timeline, keyframes, onion skinning, dope sheet, rigging, effects, audio, export, and scripting concepts in learner-friendly language. Beat Making is available at `/learner/create/beat` and can send reviewed listings to Lanmat for marketplace sale.


## Studio + button and public Explore

Learner creation now lives under `/learner/studio`. The floating `+ Studio` button opens a modal with Animation, Game, Website/App, Graphic Design, and Beat Making. Published projects become public in Explore after Flag/Lanmat review, and sellable items can enter Lanmat when age and parent approval rules allow.


## Signup roles

The registration page now asks for **Teacher / Organization** or **Parent**. Teacher / Organization covers individual teachers, schools, tuition centres, NGOs, and learning organizations. Organization accounts use the same teaching dashboard after Learnzur admin approval, with organization details stored on the teacher profile as `account_type = organization`.


## Engine and security expansion

The backend engines now include RPC, jobs, cache, security and speed files for Gamfy, Mearn, LMS, Classroom, San, Lanmat, Notify, Media, Find and Flag. Shared security implements upload validation, JSON validation, URL parameter validation, AES-256-GCM encryption, secure password derivation, safe logging, rate limiting, CORS origin checks and HTTP security headers.

## Latest performance pass

This version adds Golang backend, SvelteKit frontend and TypeScript runtime optimizations:

- Go `strings.Builder`, `sync.Pool`, pre-allocated slices and streaming response helpers.
- `http.ServeMux`, `/health`, gzip, request body limits and centralized HTTP timeouts.
- Connection reuse settings and database pool constants.
- Health-check logging bypass.
- SvelteKit SSR remains enabled with production minification and route chunking.
- Frontend performance helpers for debounce, throttle, idle tasks, cached JSON and dynamic Studio panel loading.
- Engine speed profiles now include concrete optimization rules for every engine.
- Supabase migration `184_performance_optimization_config.sql` adds performance profiles and realtime performance events.


## Classroom engine update
The Classroom engine now includes live rooms, Pion WebRTC/SFU boundaries, realtime whiteboard, chat moderation, hand raises, attendance, reconnect recovery, meetings, recordings, Redis keys, PostgreSQL migrations, 50 security rules, and 50 speed rules.

## Latest admin, email, and AI moderation update

- Transactional email uses Resend (`RESEND_API_KEY`, `RESEND_FROM_EMAIL`) instead of SMTP credentials.
- Flag moderation supports Gemini, OpenRouter, and DeepSeek through environment-selected providers.
- Admin access is stored in Supabase table `admin_portal_access`; migration `187_admin_resend_ai_flag_sandbox.sql` seeds the requested bootstrap admin email.
- Admin portal pages can view all users, parents, teachers/organizations, children/learners, and the AI chat sandbox.
- Classroom chat is scanned through the Flag engine before delivery. Unsafe/high-severity chat creates a ban/restriction action path.

## Latest auth, hosting, and admin additions

- hCaptcha is wired into login, parent signup, teacher/organization signup, forgot password, and reset password pages.
- Email OTP uses a polished Resend HTML template and `/api/auth/otp/send`.
- Admin dashboard follows the full admin spec: users, teachers, parents, learners, classes, Mearn, Lanmat, Gamfy, contests, events, sponsors, NGO, Find, Media, Security, Notifications, Help, and Settings.
- `render.yaml` supports Docker deployment on Render.
- `oracle.yaml` documents Oracle Free ARM VM hosting with Docker Compose.


## Create + Explore full spec

Learners can now create code projects, animations, movies, and games through the Create/Studio area. Published projects are scanned, approved, and then shown in Explore as public projects. Explore supports search, filters, likes, comments, reports, and SEO-safe public discovery.
