# Gamfy Engine

Boundary: see `docs/ENGINES.md`. This folder owns gamfy engine logic, Redis namespace `learnzur:gamfy:*`, database pool configuration, audit events, security controls, speed controls, and failure recovery.

Implementation rule: keep engine logic out of API route handlers.
