# Media Engine

Boundary: see `docs/ENGINES.md`. This folder owns media engine logic, Redis namespace `learnzur:media:*`, database pool configuration, audit events, security controls, speed controls, and failure recovery.

Implementation rule: keep engine logic out of API route handlers.
