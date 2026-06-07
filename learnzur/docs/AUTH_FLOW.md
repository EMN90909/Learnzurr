# Learnzur Auth Flow

- `/login` has two tabs: Parent/Teacher password login and Student/Learner PIN login.
- Parent/teacher endpoint: `POST /api/auth/login`.
- Learner endpoint: `POST /api/auth/pin/login`.
- Parent signup: `POST /api/auth/signup/parent` after OTP verification.
- Teacher signup: `POST /api/auth/signup/teacher` after certificate validation and OTP verification.
- Parent-created child account: `POST /api/auth/child/create`; alias `/api/child/create` is kept for the product spec.
- OTP send/verify: `POST /api/auth/otp/send`, `POST /api/auth/otp/verify`.
- Password reset: `POST /api/auth/forgot-password`, `POST /api/auth/reset-password`.
- Session: `POST /api/auth/refresh`, `POST /api/auth/logout`.

Security requirements carried into code contracts: bcrypt cost 12, learner PIN pepper, OTP hashes with 10-minute expiry, 15-minute access tokens, 7-day refresh tokens, generic credential errors, rate limiting, audit logging, and secure httpOnly SameSite cookies. The current skeleton exposes the routes and validation boundaries; database writes are intentionally isolated behind repository interfaces before production wiring.
