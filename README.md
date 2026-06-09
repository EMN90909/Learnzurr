# Learnzur

Learnzur is a Kenyan online holiday tuition platform for parents, teachers, learners, and administrators. The app uses a SvelteKit + TypeScript frontend, a Golang backend, Supabase PostgreSQL, Redis Streams, Nginx, Docker, and isolated Golang engines.

---

## Architecture rule

Frontend calls only `frontend/src/lib/api.ts`. Requests pass through Nginx to `backend/cmd/api/routes.go`. Engines communicate internally through Protobuf-style service boundaries and shared Redis/PostgreSQL infrastructure.

---

## Run locally with Docker

```bash
cp .env.example .env
docker compose up --build
```

Open:
http://localhost:8080


### Run backend tests

```bash
cd backend
go test ./...
go build ./cmd/api
```


### Run frontend locally

```bash
cd frontend
npm install
npm run dev -- --host 0.0.0.0
```


## Main routes

| Route | Description |
|-------|-------------|
| `/` | Landing page |
| `/login` | Login page |
| `/register` | Register page |
| `/register/parent` | Register as parent |
| `/register/teacher` | Register as teacher |
| `/register/organization` | Register as organization |
| `/teacher/dashboard` | Teacher dashboard |
| `/learner/dashboard` | Learner dashboard |
| `/parent/dashboard` | Parent dashboard |
| `/admin/dashboard` | Admin dashboard |

Role prefixes exist because SvelteKit route groups are layout-only and duplicate `/dashboard` pages would collide during build.


## Single Dockerfile runtime

The root `Dockfile` builds the SvelteKit SSR frontend and the Golang API, then runs both behind Nginx inside one container.

```bash
docker build -t learnzur .
docker run --env-file .env -p 8080:80 learnzur
```

The root `docker-compose.yml` includes Redis and PostgreSQL for cache, queues, and Supabase-compatible development.


## Learner Creation Studio

Animation tools include:
- Timeline editing
- Keyframes
- Onion skinning
- Dope sheet
- Rigging
- Effects
- Audio sync
- Export system

Scripting concepts:
- Beat Making is available at: `/learner/create/beat`

Projects can be submitted to Lanmat for marketplace review.


## Studio + button and Explore

The Studio system lives at: `/learner/studio`

The + Studio button opens:
- Animation
- Game creation
- Website/App builder
- Graphic design
- Beat making

Published projects are reviewed via Flag/Lanmat before entering Explore. Some can be monetized depending on approval rules.


## Signup roles

Registration supports:
- Teacher
- Organization
- Parent

Organizations include schools, NGOs, tuition centres, and training groups. All approved organizations use teacher dashboards with metadata stored as `account_type = organization`.


## Engine and security system

Backend engines include:
- Gamfy
- Mearn
- LMS
- Classroom
- San
- Lanmat
- Notify
- Media
- Find
- Flag

Security includes:
- Upload validation
- JSON validation
- URL sanitization
- AES-256-GCM encryption
- Password derivation security
- Rate limiting
- CORS protection
- Secure logging
- HTTP security headers


## Performance optimizations

Go optimizations using `strings.Builder`, `sync.Pool`
HTTP server tuning with `http.ServeMux`
Request limits + gzip compression
DB pooling improvements
SvelteKit SSR optimization and route chunking
Frontend caching, debounce, throttle utilities
Engine-level speed profiles per module
Supabase migration: `184_performance_optimization_config.sql`


## Classroom engine update

Includes:
- Live classroom rooms
- WebRTC/SFU (Pion)
- Chat moderation
- Whiteboard sync
- Attendance tracking
- Reconnect recovery
- Recording system
- Redis + PostgreSQL sync
- Security rules (50+)
- Performance rules (50+)


## Create + Explore system

Users can:
- Create code projects
- Build animations
- Design games
- Produce media content

All content is:
- Scanned
- Moderated
- Approved
- Published into Explore

Explore supports:
- Search
- Filters
- Likes
- Comments
- Reports


## product of emtra

product of emtra: [emtra.top](https://emtra.top)


## EMTRA-CORP PROPRIETARY LICENSE

Copyright (c) 2026 Emtra-Corp. All rights reserved.

This software and associated documentation files (the "Software") are the exclusive property of Emtra-Corp.

**NO PERMISSION IS GRANTED**

No rights, including but not limited to the rights to use, copy, modify, merge, publish, distribute, sublicense, or sell copies of the Software, are granted to any person or entity under any circumstances, except where explicitly authorized in writing by Emtra-Corp.

**RESTRICTIONS**

Without prior written permission from Emtra-Corp, you may not:
- Use the Software for any purpose
- Copy or reproduce the Software in any form
- Modify or create derivative works based on the Software
- Distribute, publish, or share the Software
- Reverse engineer, decompile, or disassemble the Software
- Remove or alter any proprietary notices contained within the Software

**CONTRIBUTIONS**

Any submission of code, patches, suggestions, or other materials to Emtra-Corp shall be considered non-confidential and may be used, modified, or incorporated into the Software by Emtra-Corp without restriction and without obligation to the contributor.

**NO WARRANTY**

The Software is provided "as is", without warranty of any kind, express or implied, including but not limited to warranties of merchantability, fitness for a particular purpose, or non-infringement.

**LIMITATION OF LIABILITY**

In no event shall Emtra-Corp be liable for any claim, damages, or other liability arising from the use or inability to use the Software.

**GOVERNING TERMS**

Any unauthorized use of the Software is strictly prohibited and may result in legal action.
