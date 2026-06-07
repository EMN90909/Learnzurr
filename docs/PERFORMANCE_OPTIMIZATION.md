
# Learnzur Performance Optimization Rulebook

## Golang backend

The backend uses `http.ServeMux`, strict request timeouts, gzip compression, request body limits, fast health checks, and context-aware helpers. Shared utilities live in `backend/internal/performance`.

Applied patterns:
- `strings.Builder` with `sync.Pool` for repeated string assembly.
- Pre-allocated slices for known response lists.
- `bytes.Buffer` and pooled buffers for stream work.
- `bufio.Reader` helpers for large reads.
- `io.Writer` streaming instead of loading full files into memory.
- `json.RawMessage` envelopes for payloads that do not need full parsing.
- `http.MaxBytesReader` for upload/body limits.
- `http.TimeoutHandler` plus server read/write/idle timeouts.
- Health-check logging is skipped.
- Cache helpers use a lock-protected TTL map, mirroring the Redis namespace model.
- Database pool settings are centralized.

## SvelteKit frontend

Applied patterns:
- SvelteKit SSR with adapter-node.
- `svelte:head` SEO metadata on public pages.
- lightweight Svelte stores instead of localStorage token storage.
- debounced inputs and throttled scroll helpers in `lib/performance.ts`.
- computed store helper for repeated derived values.
- immutable route and studio metadata with `Object.freeze()`.
- Vite production minification, CSS splitting, and compact dependency output.
- dynamic component loading helper for heavy Studio panels.

## TypeScript

Applied patterns:
- `type` aliases over interfaces for lightweight type-only contracts.
- `unknown` instead of `any` for API responses.
- `as const` and `Object.freeze()` for immutable constants.
- top-level helper functions to minimize closure churn.
- cached JSON parse helper for repeated reads.
- `Number()` conversion helper with finite-number guard.
