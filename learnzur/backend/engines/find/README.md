# Find Engine

Boundary: see `docs/ENGINES.md`. This folder owns find engine logic, Redis namespace `learnzur:find:*`, database pool configuration, audit events, security controls, speed controls, and failure recovery.

Implementation rule: keep engine logic out of API route handlers.
