# San Engine

Boundary: see `docs/ENGINES.md`. This folder owns san engine logic, Redis namespace `learnzur:san:*`, database pool configuration, audit events, security controls, speed controls, and failure recovery.

Implementation rule: keep engine logic out of API route handlers.
