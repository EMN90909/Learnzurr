# Auth Flow

Signup creates a role-specific profile. Login returns a JWT kept in SvelteKit memory stores. Every request adds `Authorization: Bearer <token>` and `internal/middleware/auth.go` verifies it.
