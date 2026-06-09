# Learnzur Implementation Matrix

This matrix maps role screens to API paths, Supabase table groups, Redis Streams and audit records. It exists to keep the pasted architecture coherent as code grows.

## Parent role

### parent to auth

- Browser entry: `/parent/auth` when the role has that module, or the closest dashboard action.
- API contract: `/api/auth/...` through `frontend/src/lib/api.ts`, then Nginx, then `backend/cmd/api/routes.go`.
- Supabase tables: `auth_audit`, role profile tables, `audit_logs`, and the relevant domain table group.
- Redis Stream: `learnzur.auth.stream` for side effects, retries and worker dispatch.
- Safety: validate JWT, verify role, sanitize free text, check idempotency, write audit before external provider calls.
- UI: use the aqua token system, high-radius cards, visible focus rings, clear empty states and no emoji-dependent meaning.

### parent to gamfy

- Browser entry: `/parent/gamfy` when the role has that module, or the closest dashboard action.
- API contract: `/api/gamfy/...` through `frontend/src/lib/api.ts`, then Nginx, then `backend/cmd/api/routes.go`.
- Supabase tables: `gamfy_audit`, role profile tables, `audit_logs`, and the relevant domain table group.
- Redis Stream: `learnzur.gamfy.stream` for side effects, retries and worker dispatch.
- Safety: validate JWT, verify role, sanitize free text, check idempotency, write audit before external provider calls.
- UI: use the aqua token system, high-radius cards, visible focus rings, clear empty states and no emoji-dependent meaning.

### parent to mearn

- Browser entry: `/parent/mearn` when the role has that module, or the closest dashboard action.
- API contract: `/api/mearn/...` through `frontend/src/lib/api.ts`, then Nginx, then `backend/cmd/api/routes.go`.
- Supabase tables: `mearn_audit`, role profile tables, `audit_logs`, and the relevant domain table group.
- Redis Stream: `learnzur.mearn.stream` for side effects, retries and worker dispatch.
- Safety: validate JWT, verify role, sanitize free text, check idempotency, write audit before external provider calls.
- UI: use the aqua token system, high-radius cards, visible focus rings, clear empty states and no emoji-dependent meaning.

### parent to lms

- Browser entry: `/parent/lms` when the role has that module, or the closest dashboard action.
- API contract: `/api/lms/...` through `frontend/src/lib/api.ts`, then Nginx, then `backend/cmd/api/routes.go`.
- Supabase tables: `lms_audit`, role profile tables, `audit_logs`, and the relevant domain table group.
- Redis Stream: `learnzur.lms.stream` for side effects, retries and worker dispatch.
- Safety: validate JWT, verify role, sanitize free text, check idempotency, write audit before external provider calls.
- UI: use the aqua token system, high-radius cards, visible focus rings, clear empty states and no emoji-dependent meaning.

### parent to classroom

- Browser entry: `/parent/classroom` when the role has that module, or the closest dashboard action.
- API contract: `/api/classroom/...` through `frontend/src/lib/api.ts`, then Nginx, then `backend/cmd/api/routes.go`.
- Supabase tables: `classroom_audit`, role profile tables, `audit_logs`, and the relevant domain table group.
- Redis Stream: `learnzur.classroom.stream` for side effects, retries and worker dispatch.
- Safety: validate JWT, verify role, sanitize free text, check idempotency, write audit before external provider calls.
- UI: use the aqua token system, high-radius cards, visible focus rings, clear empty states and no emoji-dependent meaning.

### parent to san

- Browser entry: `/parent/san` when the role has that module, or the closest dashboard action.
- API contract: `/api/san/...` through `frontend/src/lib/api.ts`, then Nginx, then `backend/cmd/api/routes.go`.
- Supabase tables: `san_audit`, role profile tables, `audit_logs`, and the relevant domain table group.
- Redis Stream: `learnzur.san.stream` for side effects, retries and worker dispatch.
- Safety: validate JWT, verify role, sanitize free text, check idempotency, write audit before external provider calls.
- UI: use the aqua token system, high-radius cards, visible focus rings, clear empty states and no emoji-dependent meaning.

### parent to lanmat

- Browser entry: `/parent/lanmat` when the role has that module, or the closest dashboard action.
- API contract: `/api/lanmat/...` through `frontend/src/lib/api.ts`, then Nginx, then `backend/cmd/api/routes.go`.
- Supabase tables: `lanmat_audit`, role profile tables, `audit_logs`, and the relevant domain table group.
- Redis Stream: `learnzur.lanmat.stream` for side effects, retries and worker dispatch.
- Safety: validate JWT, verify role, sanitize free text, check idempotency, write audit before external provider calls.
- UI: use the aqua token system, high-radius cards, visible focus rings, clear empty states and no emoji-dependent meaning.

### parent to notify

- Browser entry: `/parent/notify` when the role has that module, or the closest dashboard action.
- API contract: `/api/notify/...` through `frontend/src/lib/api.ts`, then Nginx, then `backend/cmd/api/routes.go`.
- Supabase tables: `notify_audit`, role profile tables, `audit_logs`, and the relevant domain table group.
- Redis Stream: `learnzur.notify.stream` for side effects, retries and worker dispatch.
- Safety: validate JWT, verify role, sanitize free text, check idempotency, write audit before external provider calls.
- UI: use the aqua token system, high-radius cards, visible focus rings, clear empty states and no emoji-dependent meaning.

### parent to media

- Browser entry: `/parent/media` when the role has that module, or the closest dashboard action.
- API contract: `/api/media/...` through `frontend/src/lib/api.ts`, then Nginx, then `backend/cmd/api/routes.go`.
- Supabase tables: `media_audit`, role profile tables, `audit_logs`, and the relevant domain table group.
- Redis Stream: `learnzur.media.stream` for side effects, retries and worker dispatch.
- Safety: validate JWT, verify role, sanitize free text, check idempotency, write audit before external provider calls.
- UI: use the aqua token system, high-radius cards, visible focus rings, clear empty states and no emoji-dependent meaning.

### parent to find

- Browser entry: `/parent/find` when the role has that module, or the closest dashboard action.
- API contract: `/api/find/...` through `frontend/src/lib/api.ts`, then Nginx, then `backend/cmd/api/routes.go`.
- Supabase tables: `find_audit`, role profile tables, `audit_logs`, and the relevant domain table group.
- Redis Stream: `learnzur.find.stream` for side effects, retries and worker dispatch.
- Safety: validate JWT, verify role, sanitize free text, check idempotency, write audit before external provider calls.
- UI: use the aqua token system, high-radius cards, visible focus rings, clear empty states and no emoji-dependent meaning.

### parent to flag

- Browser entry: `/parent/flag` when the role has that module, or the closest dashboard action.
- API contract: `/api/flag/...` through `frontend/src/lib/api.ts`, then Nginx, then `backend/cmd/api/routes.go`.
- Supabase tables: `flag_audit`, role profile tables, `audit_logs`, and the relevant domain table group.
- Redis Stream: `learnzur.flag.stream` for side effects, retries and worker dispatch.
- Safety: validate JWT, verify role, sanitize free text, check idempotency, write audit before external provider calls.
- UI: use the aqua token system, high-radius cards, visible focus rings, clear empty states and no emoji-dependent meaning.

## Teacher role

### teacher to auth

- Browser entry: `/teacher/auth` when the role has that module, or the closest dashboard action.
- API contract: `/api/auth/...` through `frontend/src/lib/api.ts`, then Nginx, then `backend/cmd/api/routes.go`.
- Supabase tables: `auth_audit`, role profile tables, `audit_logs`, and the relevant domain table group.
- Redis Stream: `learnzur.auth.stream` for side effects, retries and worker dispatch.
- Safety: validate JWT, verify role, sanitize free text, check idempotency, write audit before external provider calls.
- UI: use the aqua token system, high-radius cards, visible focus rings, clear empty states and no emoji-dependent meaning.

### teacher to gamfy

- Browser entry: `/teacher/gamfy` when the role has that module, or the closest dashboard action.
- API contract: `/api/gamfy/...` through `frontend/src/lib/api.ts`, then Nginx, then `backend/cmd/api/routes.go`.
- Supabase tables: `gamfy_audit`, role profile tables, `audit_logs`, and the relevant domain table group.
- Redis Stream: `learnzur.gamfy.stream` for side effects, retries and worker dispatch.
- Safety: validate JWT, verify role, sanitize free text, check idempotency, write audit before external provider calls.
- UI: use the aqua token system, high-radius cards, visible focus rings, clear empty states and no emoji-dependent meaning.

### teacher to mearn

- Browser entry: `/teacher/mearn` when the role has that module, or the closest dashboard action.
- API contract: `/api/mearn/...` through `frontend/src/lib/api.ts`, then Nginx, then `backend/cmd/api/routes.go`.
- Supabase tables: `mearn_audit`, role profile tables, `audit_logs`, and the relevant domain table group.
- Redis Stream: `learnzur.mearn.stream` for side effects, retries and worker dispatch.
- Safety: validate JWT, verify role, sanitize free text, check idempotency, write audit before external provider calls.
- UI: use the aqua token system, high-radius cards, visible focus rings, clear empty states and no emoji-dependent meaning.

### teacher to lms

- Browser entry: `/teacher/lms` when the role has that module, or the closest dashboard action.
- API contract: `/api/lms/...` through `frontend/src/lib/api.ts`, then Nginx, then `backend/cmd/api/routes.go`.
- Supabase tables: `lms_audit`, role profile tables, `audit_logs`, and the relevant domain table group.
- Redis Stream: `learnzur.lms.stream` for side effects, retries and worker dispatch.
- Safety: validate JWT, verify role, sanitize free text, check idempotency, write audit before external provider calls.
- UI: use the aqua token system, high-radius cards, visible focus rings, clear empty states and no emoji-dependent meaning.

### teacher to classroom

- Browser entry: `/teacher/classroom` when the role has that module, or the closest dashboard action.
- API contract: `/api/classroom/...` through `frontend/src/lib/api.ts`, then Nginx, then `backend/cmd/api/routes.go`.
- Supabase tables: `classroom_audit`, role profile tables, `audit_logs`, and the relevant domain table group.
- Redis Stream: `learnzur.classroom.stream` for side effects, retries and worker dispatch.
- Safety: validate JWT, verify role, sanitize free text, check idempotency, write audit before external provider calls.
- UI: use the aqua token system, high-radius cards, visible focus rings, clear empty states and no emoji-dependent meaning.

### teacher to san

- Browser entry: `/teacher/san` when the role has that module, or the closest dashboard action.
- API contract: `/api/san/...` through `frontend/src/lib/api.ts`, then Nginx, then `backend/cmd/api/routes.go`.
- Supabase tables: `san_audit`, role profile tables, `audit_logs`, and the relevant domain table group.
- Redis Stream: `learnzur.san.stream` for side effects, retries and worker dispatch.
- Safety: validate JWT, verify role, sanitize free text, check idempotency, write audit before external provider calls.
- UI: use the aqua token system, high-radius cards, visible focus rings, clear empty states and no emoji-dependent meaning.

### teacher to lanmat

- Browser entry: `/teacher/lanmat` when the role has that module, or the closest dashboard action.
- API contract: `/api/lanmat/...` through `frontend/src/lib/api.ts`, then Nginx, then `backend/cmd/api/routes.go`.
- Supabase tables: `lanmat_audit`, role profile tables, `audit_logs`, and the relevant domain table group.
- Redis Stream: `learnzur.lanmat.stream` for side effects, retries and worker dispatch.
- Safety: validate JWT, verify role, sanitize free text, check idempotency, write audit before external provider calls.
- UI: use the aqua token system, high-radius cards, visible focus rings, clear empty states and no emoji-dependent meaning.

### teacher to notify

- Browser entry: `/teacher/notify` when the role has that module, or the closest dashboard action.
- API contract: `/api/notify/...` through `frontend/src/lib/api.ts`, then Nginx, then `backend/cmd/api/routes.go`.
- Supabase tables: `notify_audit`, role profile tables, `audit_logs`, and the relevant domain table group.
- Redis Stream: `learnzur.notify.stream` for side effects, retries and worker dispatch.
- Safety: validate JWT, verify role, sanitize free text, check idempotency, write audit before external provider calls.
- UI: use the aqua token system, high-radius cards, visible focus rings, clear empty states and no emoji-dependent meaning.

### teacher to media

- Browser entry: `/teacher/media` when the role has that module, or the closest dashboard action.
- API contract: `/api/media/...` through `frontend/src/lib/api.ts`, then Nginx, then `backend/cmd/api/routes.go`.
- Supabase tables: `media_audit`, role profile tables, `audit_logs`, and the relevant domain table group.
- Redis Stream: `learnzur.media.stream` for side effects, retries and worker dispatch.
- Safety: validate JWT, verify role, sanitize free text, check idempotency, write audit before external provider calls.
- UI: use the aqua token system, high-radius cards, visible focus rings, clear empty states and no emoji-dependent meaning.

### teacher to find

- Browser entry: `/teacher/find` when the role has that module, or the closest dashboard action.
- API contract: `/api/find/...` through `frontend/src/lib/api.ts`, then Nginx, then `backend/cmd/api/routes.go`.
- Supabase tables: `find_audit`, role profile tables, `audit_logs`, and the relevant domain table group.
- Redis Stream: `learnzur.find.stream` for side effects, retries and worker dispatch.
- Safety: validate JWT, verify role, sanitize free text, check idempotency, write audit before external provider calls.
- UI: use the aqua token system, high-radius cards, visible focus rings, clear empty states and no emoji-dependent meaning.

### teacher to flag

- Browser entry: `/teacher/flag` when the role has that module, or the closest dashboard action.
- API contract: `/api/flag/...` through `frontend/src/lib/api.ts`, then Nginx, then `backend/cmd/api/routes.go`.
- Supabase tables: `flag_audit`, role profile tables, `audit_logs`, and the relevant domain table group.
- Redis Stream: `learnzur.flag.stream` for side effects, retries and worker dispatch.
- Safety: validate JWT, verify role, sanitize free text, check idempotency, write audit before external provider calls.
- UI: use the aqua token system, high-radius cards, visible focus rings, clear empty states and no emoji-dependent meaning.

## Learner role

### learner to auth

- Browser entry: `/learner/auth` when the role has that module, or the closest dashboard action.
- API contract: `/api/auth/...` through `frontend/src/lib/api.ts`, then Nginx, then `backend/cmd/api/routes.go`.
- Supabase tables: `auth_audit`, role profile tables, `audit_logs`, and the relevant domain table group.
- Redis Stream: `learnzur.auth.stream` for side effects, retries and worker dispatch.
- Safety: validate JWT, verify role, sanitize free text, check idempotency, write audit before external provider calls.
- UI: use the aqua token system, high-radius cards, visible focus rings, clear empty states and no emoji-dependent meaning.

### learner to gamfy

- Browser entry: `/learner/gamfy` when the role has that module, or the closest dashboard action.
- API contract: `/api/gamfy/...` through `frontend/src/lib/api.ts`, then Nginx, then `backend/cmd/api/routes.go`.
- Supabase tables: `gamfy_audit`, role profile tables, `audit_logs`, and the relevant domain table group.
- Redis Stream: `learnzur.gamfy.stream` for side effects, retries and worker dispatch.
- Safety: validate JWT, verify role, sanitize free text, check idempotency, write audit before external provider calls.
- UI: use the aqua token system, high-radius cards, visible focus rings, clear empty states and no emoji-dependent meaning.

### learner to mearn

- Browser entry: `/learner/mearn` when the role has that module, or the closest dashboard action.
- API contract: `/api/mearn/...` through `frontend/src/lib/api.ts`, then Nginx, then `backend/cmd/api/routes.go`.
- Supabase tables: `mearn_audit`, role profile tables, `audit_logs`, and the relevant domain table group.
- Redis Stream: `learnzur.mearn.stream` for side effects, retries and worker dispatch.
- Safety: validate JWT, verify role, sanitize free text, check idempotency, write audit before external provider calls.
- UI: use the aqua token system, high-radius cards, visible focus rings, clear empty states and no emoji-dependent meaning.

### learner to lms

- Browser entry: `/learner/lms` when the role has that module, or the closest dashboard action.
- API contract: `/api/lms/...` through `frontend/src/lib/api.ts`, then Nginx, then `backend/cmd/api/routes.go`.
- Supabase tables: `lms_audit`, role profile tables, `audit_logs`, and the relevant domain table group.
- Redis Stream: `learnzur.lms.stream` for side effects, retries and worker dispatch.
- Safety: validate JWT, verify role, sanitize free text, check idempotency, write audit before external provider calls.
- UI: use the aqua token system, high-radius cards, visible focus rings, clear empty states and no emoji-dependent meaning.

### learner to classroom

- Browser entry: `/learner/classroom` when the role has that module, or the closest dashboard action.
- API contract: `/api/classroom/...` through `frontend/src/lib/api.ts`, then Nginx, then `backend/cmd/api/routes.go`.
- Supabase tables: `classroom_audit`, role profile tables, `audit_logs`, and the relevant domain table group.
- Redis Stream: `learnzur.classroom.stream` for side effects, retries and worker dispatch.
- Safety: validate JWT, verify role, sanitize free text, check idempotency, write audit before external provider calls.
- UI: use the aqua token system, high-radius cards, visible focus rings, clear empty states and no emoji-dependent meaning.

### learner to san

- Browser entry: `/learner/san` when the role has that module, or the closest dashboard action.
- API contract: `/api/san/...` through `frontend/src/lib/api.ts`, then Nginx, then `backend/cmd/api/routes.go`.
- Supabase tables: `san_audit`, role profile tables, `audit_logs`, and the relevant domain table group.
- Redis Stream: `learnzur.san.stream` for side effects, retries and worker dispatch.
- Safety: validate JWT, verify role, sanitize free text, check idempotency, write audit before external provider calls.
- UI: use the aqua token system, high-radius cards, visible focus rings, clear empty states and no emoji-dependent meaning.

### learner to lanmat

- Browser entry: `/learner/lanmat` when the role has that module, or the closest dashboard action.
- API contract: `/api/lanmat/...` through `frontend/src/lib/api.ts`, then Nginx, then `backend/cmd/api/routes.go`.
- Supabase tables: `lanmat_audit`, role profile tables, `audit_logs`, and the relevant domain table group.
- Redis Stream: `learnzur.lanmat.stream` for side effects, retries and worker dispatch.
- Safety: validate JWT, verify role, sanitize free text, check idempotency, write audit before external provider calls.
- UI: use the aqua token system, high-radius cards, visible focus rings, clear empty states and no emoji-dependent meaning.

### learner to notify

- Browser entry: `/learner/notify` when the role has that module, or the closest dashboard action.
- API contract: `/api/notify/...` through `frontend/src/lib/api.ts`, then Nginx, then `backend/cmd/api/routes.go`.
- Supabase tables: `notify_audit`, role profile tables, `audit_logs`, and the relevant domain table group.
- Redis Stream: `learnzur.notify.stream` for side effects, retries and worker dispatch.
- Safety: validate JWT, verify role, sanitize free text, check idempotency, write audit before external provider calls.
- UI: use the aqua token system, high-radius cards, visible focus rings, clear empty states and no emoji-dependent meaning.

### learner to media

- Browser entry: `/learner/media` when the role has that module, or the closest dashboard action.
- API contract: `/api/media/...` through `frontend/src/lib/api.ts`, then Nginx, then `backend/cmd/api/routes.go`.
- Supabase tables: `media_audit`, role profile tables, `audit_logs`, and the relevant domain table group.
- Redis Stream: `learnzur.media.stream` for side effects, retries and worker dispatch.
- Safety: validate JWT, verify role, sanitize free text, check idempotency, write audit before external provider calls.
- UI: use the aqua token system, high-radius cards, visible focus rings, clear empty states and no emoji-dependent meaning.

### learner to find

- Browser entry: `/learner/find` when the role has that module, or the closest dashboard action.
- API contract: `/api/find/...` through `frontend/src/lib/api.ts`, then Nginx, then `backend/cmd/api/routes.go`.
- Supabase tables: `find_audit`, role profile tables, `audit_logs`, and the relevant domain table group.
- Redis Stream: `learnzur.find.stream` for side effects, retries and worker dispatch.
- Safety: validate JWT, verify role, sanitize free text, check idempotency, write audit before external provider calls.
- UI: use the aqua token system, high-radius cards, visible focus rings, clear empty states and no emoji-dependent meaning.

### learner to flag

- Browser entry: `/learner/flag` when the role has that module, or the closest dashboard action.
- API contract: `/api/flag/...` through `frontend/src/lib/api.ts`, then Nginx, then `backend/cmd/api/routes.go`.
- Supabase tables: `flag_audit`, role profile tables, `audit_logs`, and the relevant domain table group.
- Redis Stream: `learnzur.flag.stream` for side effects, retries and worker dispatch.
- Safety: validate JWT, verify role, sanitize free text, check idempotency, write audit before external provider calls.
- UI: use the aqua token system, high-radius cards, visible focus rings, clear empty states and no emoji-dependent meaning.

## Admin role

### admin to auth

- Browser entry: `/admin/auth` when the role has that module, or the closest dashboard action.
- API contract: `/api/auth/...` through `frontend/src/lib/api.ts`, then Nginx, then `backend/cmd/api/routes.go`.
- Supabase tables: `auth_audit`, role profile tables, `audit_logs`, and the relevant domain table group.
- Redis Stream: `learnzur.auth.stream` for side effects, retries and worker dispatch.
- Safety: validate JWT, verify role, sanitize free text, check idempotency, write audit before external provider calls.
- UI: use the aqua token system, high-radius cards, visible focus rings, clear empty states and no emoji-dependent meaning.

### admin to gamfy

- Browser entry: `/admin/gamfy` when the role has that module, or the closest dashboard action.
- API contract: `/api/gamfy/...` through `frontend/src/lib/api.ts`, then Nginx, then `backend/cmd/api/routes.go`.
- Supabase tables: `gamfy_audit`, role profile tables, `audit_logs`, and the relevant domain table group.
- Redis Stream: `learnzur.gamfy.stream` for side effects, retries and worker dispatch.
- Safety: validate JWT, verify role, sanitize free text, check idempotency, write audit before external provider calls.
- UI: use the aqua token system, high-radius cards, visible focus rings, clear empty states and no emoji-dependent meaning.

### admin to mearn

- Browser entry: `/admin/mearn` when the role has that module, or the closest dashboard action.
- API contract: `/api/mearn/...` through `frontend/src/lib/api.ts`, then Nginx, then `backend/cmd/api/routes.go`.
- Supabase tables: `mearn_audit`, role profile tables, `audit_logs`, and the relevant domain table group.
- Redis Stream: `learnzur.mearn.stream` for side effects, retries and worker dispatch.
- Safety: validate JWT, verify role, sanitize free text, check idempotency, write audit before external provider calls.
- UI: use the aqua token system, high-radius cards, visible focus rings, clear empty states and no emoji-dependent meaning.

### admin to lms

- Browser entry: `/admin/lms` when the role has that module, or the closest dashboard action.
- API contract: `/api/lms/...` through `frontend/src/lib/api.ts`, then Nginx, then `backend/cmd/api/routes.go`.
- Supabase tables: `lms_audit`, role profile tables, `audit_logs`, and the relevant domain table group.
- Redis Stream: `learnzur.lms.stream` for side effects, retries and worker dispatch.
- Safety: validate JWT, verify role, sanitize free text, check idempotency, write audit before external provider calls.
- UI: use the aqua token system, high-radius cards, visible focus rings, clear empty states and no emoji-dependent meaning.

### admin to classroom

- Browser entry: `/admin/classroom` when the role has that module, or the closest dashboard action.
- API contract: `/api/classroom/...` through `frontend/src/lib/api.ts`, then Nginx, then `backend/cmd/api/routes.go`.
- Supabase tables: `classroom_audit`, role profile tables, `audit_logs`, and the relevant domain table group.
- Redis Stream: `learnzur.classroom.stream` for side effects, retries and worker dispatch.
- Safety: validate JWT, verify role, sanitize free text, check idempotency, write audit before external provider calls.
- UI: use the aqua token system, high-radius cards, visible focus rings, clear empty states and no emoji-dependent meaning.

### admin to san

- Browser entry: `/admin/san` when the role has that module, or the closest dashboard action.
- API contract: `/api/san/...` through `frontend/src/lib/api.ts`, then Nginx, then `backend/cmd/api/routes.go`.
- Supabase tables: `san_audit`, role profile tables, `audit_logs`, and the relevant domain table group.
- Redis Stream: `learnzur.san.stream` for side effects, retries and worker dispatch.
- Safety: validate JWT, verify role, sanitize free text, check idempotency, write audit before external provider calls.
- UI: use the aqua token system, high-radius cards, visible focus rings, clear empty states and no emoji-dependent meaning.

### admin to lanmat

- Browser entry: `/admin/lanmat` when the role has that module, or the closest dashboard action.
- API contract: `/api/lanmat/...` through `frontend/src/lib/api.ts`, then Nginx, then `backend/cmd/api/routes.go`.
- Supabase tables: `lanmat_audit`, role profile tables, `audit_logs`, and the relevant domain table group.
- Redis Stream: `learnzur.lanmat.stream` for side effects, retries and worker dispatch.
- Safety: validate JWT, verify role, sanitize free text, check idempotency, write audit before external provider calls.
- UI: use the aqua token system, high-radius cards, visible focus rings, clear empty states and no emoji-dependent meaning.

### admin to notify

- Browser entry: `/admin/notify` when the role has that module, or the closest dashboard action.
- API contract: `/api/notify/...` through `frontend/src/lib/api.ts`, then Nginx, then `backend/cmd/api/routes.go`.
- Supabase tables: `notify_audit`, role profile tables, `audit_logs`, and the relevant domain table group.
- Redis Stream: `learnzur.notify.stream` for side effects, retries and worker dispatch.
- Safety: validate JWT, verify role, sanitize free text, check idempotency, write audit before external provider calls.
- UI: use the aqua token system, high-radius cards, visible focus rings, clear empty states and no emoji-dependent meaning.

### admin to media

- Browser entry: `/admin/media` when the role has that module, or the closest dashboard action.
- API contract: `/api/media/...` through `frontend/src/lib/api.ts`, then Nginx, then `backend/cmd/api/routes.go`.
- Supabase tables: `media_audit`, role profile tables, `audit_logs`, and the relevant domain table group.
- Redis Stream: `learnzur.media.stream` for side effects, retries and worker dispatch.
- Safety: validate JWT, verify role, sanitize free text, check idempotency, write audit before external provider calls.
- UI: use the aqua token system, high-radius cards, visible focus rings, clear empty states and no emoji-dependent meaning.

### admin to find

- Browser entry: `/admin/find` when the role has that module, or the closest dashboard action.
- API contract: `/api/find/...` through `frontend/src/lib/api.ts`, then Nginx, then `backend/cmd/api/routes.go`.
- Supabase tables: `find_audit`, role profile tables, `audit_logs`, and the relevant domain table group.
- Redis Stream: `learnzur.find.stream` for side effects, retries and worker dispatch.
- Safety: validate JWT, verify role, sanitize free text, check idempotency, write audit before external provider calls.
- UI: use the aqua token system, high-radius cards, visible focus rings, clear empty states and no emoji-dependent meaning.

### admin to flag

- Browser entry: `/admin/flag` when the role has that module, or the closest dashboard action.
- API contract: `/api/flag/...` through `frontend/src/lib/api.ts`, then Nginx, then `backend/cmd/api/routes.go`.
- Supabase tables: `flag_audit`, role profile tables, `audit_logs`, and the relevant domain table group.
- Redis Stream: `learnzur.flag.stream` for side effects, retries and worker dispatch.
- Safety: validate JWT, verify role, sanitize free text, check idempotency, write audit before external provider calls.
- UI: use the aqua token system, high-radius cards, visible focus rings, clear empty states and no emoji-dependent meaning.

