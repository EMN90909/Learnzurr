# Learnzur AI Rules & Tech Stack

## Tech Stack
- **Frontend**: SvelteKit + TypeScript with SSR (Server-Side Rendering) enabled via `@sveltejs/adapter-node`.
- **Backend**: Golang (Go) for the API server and isolated background engines.
- **Database**: Supabase (PostgreSQL) for persistent storage and Supabase Auth for user management.
- **Realtime**: Supabase Realtime for live data sync and Pion WebRTC for live classroom video/audio.
- **Cache & Queue**: Redis for namespaced caching and Redis Streams for asynchronous background jobs.
- **Styling**: Tailwind CSS for utility-first styling and custom CSS for mobile-first responsive design.
- **Icons**: Lucide Svelte for consistent iconography.
- **Deployment**: Docker and Docker Compose for service orchestration and isolated runtime environments.

## Library & Architecture Rules

### 1. Frontend Communication
- **Rule**: All frontend API calls **MUST** go through `frontend/src/lib/api.ts`.
- **Reason**: This ensures consistent auth header injection, CSRF protection, and error handling.

### 2. Backend Routing
- **Rule**: All REST API routes **MUST** be registered in `backend/cmd/api/routes.go`.
- **Reason**: Centralized routing makes the API surface discoverable and easier to secure.

### 3. Engine Isolation
- **Rule**: Business logic for specific features (Gamfy, Mearn, LMS, etc.) **MUST** reside in `backend/engines/[engine_name]/`.
- **Reason**: Maintains strict service boundaries and allows engines to fail or scale independently.

### 4. Security & Performance
- **Rule**: Every engine **MUST** include a `security.go` file (40+ rules) and a `speed.go` file (50+ rules).
- **Reason**: Enforces the "Security by Design" and "Performance First" philosophy of the platform.

### 5. Realtime Subscriptions
- **Rule**: Use `frontend/src/lib/realtime.ts` for all Supabase table subscriptions.
- **Reason**: Centralizes realtime connection management and prevents duplicate listeners.

### 6. State Management
- **Rule**: Use Svelte stores in `frontend/src/lib/stores.ts` for global application state.
- **Reason**: Provides a reactive, lightweight way to share data across components without prop drilling.

### 7. UI Components
- **Rule**: Reusable UI components **MUST** be placed in `frontend/src/lib/components/`.
- **Reason**: Promotes reusability and keeps the `routes` directory focused on page-specific logic.

### 8. Icons
- **Rule**: Use `lucide-svelte` for all icons.
- **Reason**: Ensures a consistent visual language across all dashboards.