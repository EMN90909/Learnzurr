# Lms Runbook
## 1. Quiz publishing
This workflow is implemented as a deterministic platform contract. The frontend creates a small, typed request. The Go API validates identity, role, input shape and idempotency before writing to Supabase PostgreSQL or placing a Redis Stream job. The worker processes slow side effects and writes audit records that are append-only. The design avoids direct browser access to service-role credentials and keeps every sensitive transition observable.

Operational checks:

- Validate the authenticated role before the action.
- Normalize Kenyan phone numbers, identifiers and free-text input.
- Use a stable idempotency key for money, moderation and grading actions.
- Store the request, decision and final result in the matching audit table.
- Notify affected users only after the durable state has changed.
- Return safe, user-readable messages to SvelteKit; keep provider internals in logs.

## 2. Autosave and submission locking
This workflow is implemented as a deterministic platform contract. The frontend creates a small, typed request. The Go API validates identity, role, input shape and idempotency before writing to Supabase PostgreSQL or placing a Redis Stream job. The worker processes slow side effects and writes audit records that are append-only. The design avoids direct browser access to service-role credentials and keeps every sensitive transition observable.

Operational checks:

- Validate the authenticated role before the action.
- Normalize Kenyan phone numbers, identifiers and free-text input.
- Use a stable idempotency key for money, moderation and grading actions.
- Store the request, decision and final result in the matching audit table.
- Notify affected users only after the durable state has changed.
- Return safe, user-readable messages to SvelteKit; keep provider internals in logs.

## 3. Gradebook calculation
This workflow is implemented as a deterministic platform contract. The frontend creates a small, typed request. The Go API validates identity, role, input shape and idempotency before writing to Supabase PostgreSQL or placing a Redis Stream job. The worker processes slow side effects and writes audit records that are append-only. The design avoids direct browser access to service-role credentials and keeps every sensitive transition observable.

Operational checks:

- Validate the authenticated role before the action.
- Normalize Kenyan phone numbers, identifiers and free-text input.
- Use a stable idempotency key for money, moderation and grading actions.
- Store the request, decision and final result in the matching audit table.
- Notify affected users only after the durable state has changed.
- Return safe, user-readable messages to SvelteKit; keep provider internals in logs.

## 4. Appeals workflow
This workflow is implemented as a deterministic platform contract. The frontend creates a small, typed request. The Go API validates identity, role, input shape and idempotency before writing to Supabase PostgreSQL or placing a Redis Stream job. The worker processes slow side effects and writes audit records that are append-only. The design avoids direct browser access to service-role credentials and keeps every sensitive transition observable.

Operational checks:

- Validate the authenticated role before the action.
- Normalize Kenyan phone numbers, identifiers and free-text input.
- Use a stable idempotency key for money, moderation and grading actions.
- Store the request, decision and final result in the matching audit table.
- Notify affected users only after the durable state has changed.
- Return safe, user-readable messages to SvelteKit; keep provider internals in logs.

## 5. Progress snapshots
This workflow is implemented as a deterministic platform contract. The frontend creates a small, typed request. The Go API validates identity, role, input shape and idempotency before writing to Supabase PostgreSQL or placing a Redis Stream job. The worker processes slow side effects and writes audit records that are append-only. The design avoids direct browser access to service-role credentials and keeps every sensitive transition observable.

Operational checks:

- Validate the authenticated role before the action.
- Normalize Kenyan phone numbers, identifiers and free-text input.
- Use a stable idempotency key for money, moderation and grading actions.
- Store the request, decision and final result in the matching audit table.
- Notify affected users only after the durable state has changed.
- Return safe, user-readable messages to SvelteKit; keep provider internals in logs.

## 6. Notification triggers
This workflow is implemented as a deterministic platform contract. The frontend creates a small, typed request. The Go API validates identity, role, input shape and idempotency before writing to Supabase PostgreSQL or placing a Redis Stream job. The worker processes slow side effects and writes audit records that are append-only. The design avoids direct browser access to service-role credentials and keeps every sensitive transition observable.

Operational checks:

- Validate the authenticated role before the action.
- Normalize Kenyan phone numbers, identifiers and free-text input.
- Use a stable idempotency key for money, moderation and grading actions.
- Store the request, decision and final result in the matching audit table.
- Notify affected users only after the durable state has changed.
- Return safe, user-readable messages to SvelteKit; keep provider internals in logs.

