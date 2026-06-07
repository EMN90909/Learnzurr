# Security Baseline

## Global protections

1. JWT validation on protected endpoints.
2. httpOnly Secure SameSite refresh cookies.
3. Memory-only access token storage in the frontend.
4. Rate limiting per endpoint family.
5. Generic auth errors.
6. bcrypt cost 12 for passwords and PINs.
7. PIN pepper from environment only.
8. OTP hashes only; no raw OTP persistence.
9. OTP expiry at 10 minutes.
10. Refresh token rotation.
11. Session invalidation on logout.
12. Audit logs for sensitive actions.
13. No sensitive fields in logs.
14. Prepared statements only.
15. Input size limits.
16. JSON decoder body caps.
17. CORS allowlist.
18. Security headers at Nginx and API.
19. RLS enabled on all Supabase tables.
20. Admin actions require admin role.
21. Teacher access scoped to owned/co-taught classes.
22. Parent access scoped to owned children.
23. Learner access scoped to own enrolled classes.
24. Financial tables append-only by policy.
25. Idempotency keys for payment callbacks.
26. Webhook signature verification for Daraja callbacks.
27. Redis namespaces per engine.
28. Queue dead-lettering.
29. Sandbox CPU/memory/network limits.
30. File upload MIME and size validation.
31. Certificate moderation workflow.
32. Marketplace content moderation workflow.
33. Classroom camera caps.
34. Classroom reconnect timeout.
35. VAPID key rotation support.
36. AES-256 envelope for sensitive data.
37. IP/device anomaly logging.
38. Duplicate submission protection.
39. CSRF protection for cookie-auth mutations.
40. Secrets only through environment variables.
