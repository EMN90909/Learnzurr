# Lanmat Engine

Boundary: see `docs/ENGINES.md`. This folder owns lanmat engine logic, Redis namespace `learnzur:lanmat:*`, database pool configuration, audit events, security controls, speed controls, and failure recovery.

Implementation rule: keep engine logic out of API route handlers.
