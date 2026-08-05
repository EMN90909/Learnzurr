# Learnzurr frontends

This directory contains the two supported client applications:

- `website/` — React + TypeScript + Vite web application, duplicated from the active root frontend.
- `mobile_app/` — Flutter application targeting Android and iOS.

## Website

```bash
cd frontend/website
npm install
npm run dev
```

Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` before running the website.

## Mobile app

The Flutter source, Supabase authentication, four role dashboards, and eight pages per role are in `mobile_app/lib/main.dart`.

Generate or refresh the native Android and iOS runners using:

```bash
cd frontend/mobile_app
sh tool/bootstrap_platforms.sh
flutter run
```

For Android emulator access to local services, the default mobile environment uses `10.0.2.2`. For an iOS simulator, replace local service addresses with `127.0.0.1`. For physical devices, use an HTTPS/WSS host reachable from the device.

The Supabase anon key is a public client key. Never place the Supabase service-role key, Paystack secret key, or SMTP credentials in the Flutter application.
