# Mearn Engine

Boundary: see `docs/ENGINES.md`. This folder owns mearn engine logic, Redis namespace `learnzur:mearn:*`, database pool configuration, audit events, security controls, speed controls, and failure recovery.

Implementation rule: keep engine logic out of API route handlers.
