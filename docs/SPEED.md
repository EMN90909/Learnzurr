# Speed

Global speed features include SvelteKit SSR/CSR split, code splitting, gzip, Redis cache, Redis Streams, cursor pagination, batch writes, connection pooling, prepared statements, service worker offline shell, mobile-first CSS, small HTML payloads, async media jobs, cached public class pages, and engine-specific hot paths.

Each engine includes 50 speed rule entries in its `speed.go` file.


## Added Golang backend optimizations

- strings.Builder and sync.Pool are used for repeated string/buffer assembly.
- Known-size lists are pre-allocated in API responses and engine rules.
- http.ServeMux remains the routing source of truth.
- Request body size is bounded with http.MaxBytesReader.
- Health checks avoid logging/compression overhead.
- Server read/write/idle/request timeouts are centralized.
- TCP reuse settings are defined for outbound clients.
- DB pool limits are centralized.
- Context cancellation is part of the performance helpers.
- Streaming helpers avoid loading large media/sandbox responses into memory.

## Added SvelteKit and TypeScript optimizations

- Vite minifies production JS and chunks vendor/studio tools.
- SvelteKit SSR stays enabled through adapter-node.
- Public pages use svelte:head for SEO.
- Studio helpers support lazy dynamic loading.
- Debounce/throttle/idle helpers reduce UI work.
- Immutable `Object.freeze()` metadata avoids unnecessary re-creation.
- `unknown` replaces `any` in the API client.
