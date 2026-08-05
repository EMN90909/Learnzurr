# Learnzurr frontends

This directory contains the two supported client applications:

- `website/` — React + TypeScript + Vite web application duplicated from the active web frontend.
- `mobile_app/` — Flutter application targeting Android and iOS.

## Website

```bash
cd frontend/website
npm install
npm run dev
```

Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` before running the website.

## Mobile app

The mobile app intentionally does not include the public visitor or marketing page. It opens on the shared sign-in screen and then routes verified users to the teacher, learner, guardian, or administrator dashboard.

The Flutter client includes:

- Supabase sign-in, role-specific signup, session persistence, and email-verification redirects.
- Eight dashboard pages for each of the four roles.
- Express backend health checks with the current Supabase access token attached as a bearer token.
- Teacher invitations through `POST /api/team/invite`.
- Paystack initialization through `POST /api/payments/initialize` and external checkout opening.
- Payment verification support through `GET /api/payments/verify/:reference`.
- Shared signaling URL configuration for future WebRTC classroom screens.

Generate or refresh the native Android and iOS runners using:

```bash
cd frontend/mobile_app
sh tool/bootstrap_platforms.sh
flutter run
```

For Android emulator access to local services, use `10.0.2.2`. For the iOS simulator, use `127.0.0.1`. Physical devices must use an HTTPS/WSS hostname reachable from the device.

Configure `mobile_app/.env`:

```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-public-anon-key
EMAIL_REDIRECT_URL=io.learnzurr.app://signin-callback
API_BASE_URL=https://api.example.com
SIGNALING_URL=wss://signal.example.com
```

The Supabase anon key is a public client key. Never place the Supabase service-role key, Paystack secret key, or SMTP credentials in the Flutter application.
