LEARNZUR COOKIES — WHAT TO ADD AND WHAT THEY CAN DO

============================================================
1. SHOULD LEARNZUR USE COOKIES?
============================================================

Yes.

Cookies are useful for:
- secure login sessions
- refresh tokens
- remembering safe preferences
- CSRF protection
- device/session tracking
- rate-limit support
- keeping users logged in safely
- protecting parent/teacher/admin dashboards

But cookies must be used carefully.

Do NOT store:
- raw password
- raw PIN
- OTP
- M-Pesa secrets
- private learner data
- full user profile
- payment details
- access permissions as trusted frontend data

============================================================
2. BEST COOKIE SETUP FOR LEARNZUR
============================================================

Use cookies like this:

Access token:
- short life
- 15 minutes
- can be kept in memory
- not localStorage

Refresh token:
- stored in secure cookie
- httpOnly
- Secure
- SameSite=Lax or Strict
- 7 days
- rotated on refresh

Example cookie settings:

httpOnly = true
Secure = true
SameSite = Lax or Strict
Path = /
MaxAge = 7 days for refresh token

============================================================
3. COOKIES TO ADD
============================================================

1. learnzur_refresh
Purpose:
- Stores refresh token securely.
- Used to get a new access token.

Security:
- httpOnly
- Secure
- SameSite=Lax
- encrypted/hashed in database
- rotated on refresh

------------------------------------------------------------

2. learnzur_csrf
Purpose:
- Protects forms and sensitive POST requests from CSRF attacks.

Used for:
- signup
- login
- logout
- payment actions
- payout requests
- profile updates
- admin actions

Security:
- SameSite=Lax or Strict
- checked by backend on sensitive requests

------------------------------------------------------------

3. learnzur_device
Purpose:
- Identifies the browser/device session.

Used for:
- suspicious login detection
- session management
- logout from device
- audit logs
- rate limiting

Do not use it as authentication by itself.

------------------------------------------------------------

4. learnzur_role_hint
Purpose:
- Optional UI hint only.
- Helps frontend know whether to show parent/teacher/learner layout faster.

Example:
- parent
- teacher
- learner
- admin

Important:
- Backend must never trust this cookie for permissions.
- Real role must come from JWT/backend session.

------------------------------------------------------------

5. learnzur_theme
Purpose:
- Remember light/dark/theme preference.

Safe to store:
- light
- dark
- system
- junior theme
- senior theme

------------------------------------------------------------

6. learnzur_locale
Purpose:
- Remember language/location preference.

Example:
- en-KE
- sw-KE if Kiswahili is added later

------------------------------------------------------------

7. learnzur_last_dashboard
Purpose:
- Remember last dashboard path.

Example:
- /dashboard/teacher
- /dashboard/parent
- /dashboard/learner

Important:
- Must validate redirect path.
- Prevent open redirects.

------------------------------------------------------------

8. learnzur_offline_mode
Purpose:
- Helps frontend know if service worker/offline mode was enabled.

This is safe because it is not private.

============================================================
4. WHAT COOKIES CAN DO IN LEARNZUR
============================================================

Cookies can help with:

AUTHENTICATION
- keep parent/teacher/learner/admin logged in
- refresh expired access tokens
- logout safely
- detect expired sessions
- rotate refresh tokens

SECURITY
- prevent CSRF attacks
- detect suspicious devices
- rate-limit repeated login attempts
- protect admin actions
- protect payment actions
- support session invalidation
- support logout from all devices

USER EXPERIENCE
- remember theme
- remember language
- remember last dashboard
- reduce repeated login prompts
- support mobile-friendly sessions

ADMIN SECURITY
- track admin device sessions
- require stronger checks for payouts/treasury
- audit admin session activity
- force logout after sensitive changes

PARENT / LEARNER SAFETY
- keep learner sessions shorter
- allow parent to reset learner PIN
- prevent learner token from lasting too long
- separate parent/teacher login from learner PIN login

============================================================
5. AUTH COOKIE FLOW
============================================================

Parent/Teacher login:

User logs in with email/phone + password
→ backend verifies credentials
→ backend creates access token
→ backend creates refresh token
→ backend stores refresh token hash in database
→ backend sends access token response
→ backend sets learnzur_refresh cookie
→ frontend stores access token in memory only
→ user enters dashboard

Learner login:

Learner logs in with username + PIN
→ backend verifies PIN using bcrypt + pepper
→ backend creates learner session
→ backend sets secure refresh cookie
→ access token stored in memory
→ learner enters dashboard

Refresh flow:

Access token expires after 15 minutes
→ frontend calls /api/auth/refresh
→ browser sends learnzur_refresh automatically
→ backend verifies refresh token
→ backend rotates refresh token
→ backend sends new access token
→ backend sets new refresh cookie

Logout flow:

User clicks logout
→ frontend calls /api/auth/logout
→ backend invalidates refresh token
→ backend clears cookie
→ frontend clears memory token
→ user goes to login

============================================================
6. COOKIE SECURITY RULES
============================================================

1. Never store passwords in cookies.
2. Never store PINs in cookies.
3. Never store OTPs in cookies.
4. Never store M-Pesa secrets in cookies.
5. Never store full learner profile in cookies.
6. Use httpOnly for refresh token cookie.
7. Use Secure for all auth cookies.
8. Use SameSite=Lax or Strict.
9. Use short access token lifetime.
10. Rotate refresh tokens.
11. Hash refresh tokens in database.
12. Invalidate refresh token on logout.
13. Invalidate all sessions after password reset.
14. Invalidate learner session after PIN reset.
15. Use CSRF token for sensitive actions.
16. Do not trust role_hint cookie for permissions.
17. Backend must always check JWT/session role.
18. Validate redirect URLs from cookies.
19. Clear cookies on logout.
20. Clear cookies on account suspension.
21. Clear cookies on teacher ban.
22. Clear cookies on admin role removal.
23. Use separate session rules for admin.
24. Admin session should expire faster.
25. Payment actions may require fresh login.
26. Payout approvals may require re-auth.
27. Do not log cookie values.
28. Do not expose refresh token to JavaScript.
29. Use cookie Path=/ for auth cookie.
30. Use cookie Domain carefully.
31. Avoid third-party cookies.
32. Use HTTPS only.
33. Do not use cookies as database truth.
34. Do not store permissions in editable cookies.
35. Detect refresh token reuse.
36. Revoke token family on reuse.
37. Keep session table with device info.
38. Store created_at and expires_at.
39. Store revoked_at for logout.
40. Audit sensitive session actions.

============================================================
7. COOKIE DATABASE TABLES TO ADD
============================================================

sessions table:

sessions
- id
- user_id
- role
- refresh_token_hash
- device_id
- device_name
- ip_address
- user_agent
- created_at
- expires_at
- last_used_at
- revoked_at
- revoke_reason

csrf_tokens table if needed:

csrf_tokens
- id
- user_id
- token_hash
- created_at
- expires_at
- used_at

device_sessions table if separate:

device_sessions
- id
- user_id
- device_id
- device_name
- user_agent
- ip_address
- first_seen_at
- last_seen_at
- trusted
- revoked_at

============================================================
8. AUTH ENDPOINTS THAT USE COOKIES
============================================================

POST /api/auth/login
- parent/teacher login
- sets refresh cookie

POST /api/auth/pin/login
- learner login
- sets refresh cookie

POST /api/auth/refresh
- reads refresh cookie
- rotates refresh token
- returns new access token

POST /api/auth/logout
- clears refresh cookie
- revokes current session

POST /api/auth/logout-all
- revokes all user sessions
- clears current cookie

GET /api/auth/session
- checks current session
- returns safe user summary

POST /api/auth/csrf
- creates/refreshes CSRF token if needed

============================================================
9. COOKIE EXAMPLE FOR GOLANG
============================================================

Set refresh cookie:

http.SetCookie(w, &http.Cookie{
    Name:     "learnzur_refresh",
    Value:    refreshToken,
    Path:     "/",
    MaxAge:   60 * 60 * 24 * 7,
    HttpOnly: true,
    Secure:   true,
    SameSite: http.SameSiteLaxMode,
})

Clear refresh cookie:

http.SetCookie(w, &http.Cookie{
    Name:     "learnzur_refresh",
    Value:    "",
    Path:     "/",
    MaxAge:   -1,
    HttpOnly: true,
    Secure:   true,
    SameSite: http.SameSiteLaxMode,
})

============================================================
10. WHAT NOT TO DO
============================================================

Do not do this:

localStorage.setItem("token", token)

Do not store:

document.cookie = "password=..."
document.cookie = "pin=..."
document.cookie = "role=admin"
document.cookie = "mpesa_secret=..."
document.cookie = "learner_private_data=..."

Do not trust this:

role from cookie
permissions from cookie
payment status from cookie
teacher approval from cookie
admin status from cookie

Always verify from backend/database.

============================================================
11. BEST LEARNZUR COOKIE DESIGN
============================================================

Use this:

- Access token in memory only
- Refresh token in httpOnly Secure cookie
- Refresh token hash in database
- CSRF token for sensitive actions
- Theme/language in normal safe cookies
- Backend authorization on every protected endpoint
- No localStorage for auth
- No secrets in frontend
- No sensitive user data in cookies

============================================================
12. SIMPLE SUMMARY
============================================================

Yes, add cookies.

Use cookies for:
- refresh login session
- CSRF protection
- device tracking
- theme
- language
- safe dashboard preference

Do not use cookies for:
- passwords
- PINs
- OTPs
- payment secrets
- private learner data
- admin permissions

Best setup:
- access token in memory
- refresh token in httpOnly Secure cookie
- backend checks role and permissions
- refresh token rotates
- logout clears cookie