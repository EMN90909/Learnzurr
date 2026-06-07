# Lms Engine

Boundary: see `docs/ENGINES.md`. This folder owns lms engine logic, Redis namespace `learnzur:lms:*`, database pool configuration, audit events, security controls, speed controls, and failure recovery.

Implementation rule: keep engine logic out of API route handlers.
