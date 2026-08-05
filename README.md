# Learnzurr

Learnzurr is a multi-client learning platform with a React website, Flutter mobile app, TypeScript/Express API, Supabase authentication and data, Paystack payments, and a focused Go WebRTC signaling service.

## Frontends

- `frontend/website` — authoritative React 18 + TypeScript + Vite website.
- `frontend/mobile_app` — Flutter client for Android and iOS.

The website contains one shared sign-in, separate teacher/learner/guardian/admin signup flows, email verification, and four role dashboards with eight pages each.

## Teacher workflows

Teachers can view learner totals, verified Paystack revenue, owned classes, team members, and quick actions. Team owners can invite teachers by email and set a revenue percentage. Supabase sends the invitation through the project SMTP configuration; the invited teacher chooses a password, accepts the team membership, and then uses the shared sign-in page.

Teachers can schedule live classes and publish tasks, questions, quizzes, assessments, and exams using the rich-text editor. Scheduling persists the session, generates a signed join URL, and notifies enrolled learners through SMTP email and browser web push when configured.

## Live classroom

The React classroom implements:

- one WebRTC peer connection per learner
- teacher-only camera/audio broadcast
- 200p, 244p, and 360p bitrate presets
- ICE candidate exchange with configurable STUN/TURN servers
- teacher screen sharing
- chat and Q&A overlay
- shared Canvas whiteboard events
- signed, authenticated classroom joins

The Go service in `signaling/` relays SDP, ICE, chat, Q&A, and whiteboard messages over WebSockets. It enforces two teachers and 50 learners per room, uses bounded queues and pooled buffers, monitors connections with ping/pong, and exposes `/healthz` metrics. Media remains peer-to-peer; TURN is optional initially but should be configured for reliable production NAT traversal.

## Data architecture

Supabase migrations define profiles and roles, teacher teams and invitations, classes, class teachers, student enrollments, lessons, live sessions, assignments, Q&A, progress, Paystack payments and commission splits, push subscriptions, session participants, chat, and whiteboard events. Database triggers enforce the teacher and learner limits.

## Development

```bash
npm install
cp .env.example .env
npm run dev
npm run dev:signal
```

- Website: `http://localhost:5173`
- Express API: `http://localhost:8081`
- Go signaling health: `http://localhost:8090/healthz`

Apply the Supabase migrations and configure email confirmation plus custom SMTP before testing signup and invitations.

## Production

```bash
npm run build
npm start
```

Express serves the Vite output from `frontend/website`. Keep `PAYSTACK_SECRET_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, SMTP credentials, VAPID private key, TURN credentials, and `SIGNALING_SHARED_SECRET` server-only.
