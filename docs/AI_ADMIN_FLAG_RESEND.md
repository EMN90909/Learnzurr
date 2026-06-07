# Learnzur Resend, AI Flag, and Supabase Admin Update

## Email
SMTP has been replaced by Resend. Configure `RESEND_API_KEY` and `RESEND_FROM_EMAIL`.

## AI moderation
Flag supports Gemini, OpenRouter, and DeepSeek through provider boundary files under `backend/engines/flag/internal/flag/providers/`.
The active provider is selected with `FLAG_PROVIDER=gemini|openrouter|deepseek`.

## Admin portal
Admin access is stored in Supabase table `admin_portal_access`. Migration `187_admin_resend_ai_flag_sandbox.sql` seeds `nasongoemmanuel8@gmail.com` as `super_admin`.
The login flow checks Supabase admin access rather than hardcoding the email inside frontend routes.

## Chat sandbox and bans
Classroom chat is sent to `/api/flag/scan` before delivery. The Flag engine creates a chat sandbox result with `room_id`, `user_id`, sanitized message, provider, severity, and action. High/critical results create a ban/restriction path.
