# Classroom Engine

Boundary: see `docs/ENGINES.md`. This folder owns classroom engine logic, Redis namespace `learnzur:classroom:*`, database pool configuration, audit events, security controls, speed controls, and failure recovery.

Implementation rule: keep engine logic out of API route handlers.
