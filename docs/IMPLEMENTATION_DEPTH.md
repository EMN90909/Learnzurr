# Learnzur Implementation Depth

This version expands the platform with concrete service contracts, validation, pricing, queueing, audit, security and speed logic. It is still an MVP scaffold, but it is designed so every folder has meaningful code that can be implemented behind real providers.

## API contract
All browser requests go through `frontend/src/lib/api.ts`. The SvelteKit app never talks directly to Redis, PostgreSQL or engines. The Go API validates JWTs, applies rate limits, then forwards work to internal services.

## Data flow example: learner submits quiz
1. SvelteKit posts answers to `/api/lms/quiz/submit`.
2. API middleware verifies JWT and learner role.
3. LMS validates deadline, one-submission rules, and question ownership.
4. LMS writes submission and grade transactionally.
5. LMS creates Redis Stream job for Gamfy points.
6. Worker dispatches `gamfy.award_points`.
7. Notify sends badge/grade notifications.
8. Parent dashboard sees updated progress snapshot.

## Data flow example: class payment
1. Parent initiates STK push from `/parent/payments/enroll`.
2. Mearn normalizes phone, stores pending idempotency key, calls Daraja.
3. Callback is verified and stored raw.
4. Split is calculated server-side only.
5. Enrollment is activated after confirmed payment.
6. Receipt PDF is queued through Media.
7. Notifications go to parent, learner and teacher.

## Safety-first decisions
- Children do not pay directly.
- Marketplace purchases by learners require parent approval.
- Teacher publishing requires certificate verification.
- Chat is scanned before delivery when risk is high.
- Audit logs are append-only.
