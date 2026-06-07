# Learnzur Engines

Each engine is isolated behind an API boundary, Redis namespace, database pool, health check, audit trail, and failure policy. Heavy jobs must go through Redis queues.

| Engine | Responsibility | Redis namespace | Failure behavior |
|---|---|---|---|
| Gamfy | Points, badges, streaks, levels, age-adaptive presentation policy. | `gamfy:*` | Disable rewards temporarily; never block class access. |
| Mearn | M-Pesa STK Push, append-only ledger, royalty splits, payouts, treasury. | `mearn:*` | Freeze payouts, continue idempotent callback capture. |
| LMS | Quizzes, tests, assignments, grades, timetable, progress. | `lms:*` | Preserve submissions locally/queue; expose read-only cached state. |
| Classroom | Pion WebRTC rooms, teacher + 50 students, max 10 cameras, reconnect windows. | `classroom:*` | Close room state safely; allow reconnect within policy window. |
| San | Sandbox for HTML/CSS/JS/PHP/SvelteKit/MicroPython with 10MB RAM and 0.05 CPU. | `san:*` | Kill containers and quarantine abusive jobs. |
| Lanmat | Marketplace listings, moderation, purchases, 90% royalties. | `lanmat:*` | Pause purchases/listing publication; preserve ledger intents. |
| Notify | VAPID push, SMTP, class-start rings, urgency scheduling. | `notify:*` | Retry with backoff; persist notification state. |
| Media | Rendering animations, movies, PDFs, certificates; largest worker footprint. | `media:*` | Queue jobs and resume from checkpoints. |
| Find | Search, filters, pg_trgm-backed discovery, SSR metadata. | `find:*` | Serve stale cache while indexer catches up. |
