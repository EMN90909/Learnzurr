# Notify Engine

Boundary: see `docs/ENGINES.md`. This folder owns notify engine logic, Redis namespace `learnzur:notify:*`, database pool configuration, audit events, security controls, speed controls, and failure recovery.

Implementation rule: keep engine logic out of API route handlers.
