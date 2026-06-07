# Learnzur Security Audit Fixes

This package was scanned and patched after the Create + Explore full-spec build.

## Checks run

- File health: no empty files.
- Brand scan: no old Struta/funeral-facing references in app code.
- Secret scan: no live API keys or passwords committed.
- Route scan: SvelteKit page routes have no collisions.
- Backend compile: `go test ./...`, `go vet ./...`, `go build ./cmd/api`, `go build ./cmd/worker`.
- Runtime spot checks: `/api/health`, admin route without token, admin route with signed admin token.

## Vulnerabilities fixed

1. **Unsigned auth tokens replaced**
   - Before: access tokens were base64-encoded JSON payloads.
   - Now: tokens are HMAC-SHA256 signed, include `iat`, `exp`, `iss`, and `aud`, and require `LEARNZUR_JWT_SECRET`.
   - Files:
     - `backend/internal/security/token.go`
     - `backend/internal/middleware/auth.go`
     - `backend/cmd/auth/login.go`

2. **Admin APIs protected at backend gateway**
   - Before: `/api/admin/*` routes returned data without backend role enforcement.
   - Now: every `/api/admin/*` request must pass signed token validation and `admin` role check.
   - File: `backend/cmd/api/routes.go`

3. **Parent-only learner creation protected**
   - `/api/auth/child/create` now requires a signed `parent` or `admin` token.
   - File: `backend/cmd/api/routes.go`

4. **Notification subscription protected**
   - `/api/notify/subscribe` now requires authentication.
   - File: `backend/cmd/api/routes.go`

5. **Supabase authentication gated**
   - Password login requires a configured Supabase Auth provider.
   - Production hosting requires Supabase Auth and a strong JWT secret.
   - Supabase password verification is used when `SUPABASE_ANON_KEY` is configured.
   - Files:
     - `backend/cmd/auth/login.go`
     - `backend/internal/supabase/client.go`
     - `render.yaml`

6. **OTP preview hardened**
   - OTP values are generated with secure randomness.
   - Preview HTML is returned only when `LEARNZUR_EMAIL_PREVIEW=true`.
   - OTP purpose text is escaped before entering HTML.
   - File: `backend/cmd/auth/otp.go`

7. **Signup validation hardened**
   - Email, phone, password complexity, text length, subject arrays, age group arrays, and organization fields are validated/sanitized.
   - Passwords go through the shared password hashing path before persistence boundaries.
   - File: `backend/cmd/auth/signup.go`

8. **Secure logout cookies**
   - Logout clears refresh cookies with `HttpOnly`, `SameSite=Strict`, and `Secure` by default.
   - File: `backend/cmd/auth/session.go`

9. **Production env hardening**
   - Render config now requires `LEARNZUR_JWT_SECRET` and disables hCaptcha bypass.
   - File: `render.yaml`

10. **Generated binaries removed from source package**
   - `backend/api` and `backend/worker` build artifacts are excluded from the delivered ZIP.
   - File: `.gitignore`

## Required production secrets

Set these before deployment:

- `LEARNZUR_JWT_SECRET` — at least 32 characters, random.
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `HCAPTCHA_SECRET`
- `PUBLIC_HCAPTCHA_SITE_KEY`
- `RESEND_API_KEY`
- `RESEND_FROM_EMAIL`
- AI provider key for `FLAG_PROVIDER`.

## Remaining integration work

The code compiles and routes are secured, but live production verification still depends on real Supabase, Resend, hCaptcha, Redis, Daraja, and AI provider credentials. Those integrations must be tested with real environment values before launch.
