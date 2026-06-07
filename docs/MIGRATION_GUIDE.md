# Migration Guide

The source school-dashboard fork was used only as the starting reference. Existing dashboard roles were mapped into Learnzur roles:

- Parents → Parent dashboard
- Teachers → Teacher dashboard
- learners → Learner dashboard
- Admin → Admin dashboard

React, Vite app pages, Express/TypeScript routes, and old brand assets are not carried into the final app. The final application is SvelteKit + TypeScript + Golang with Supabase migrations and Redis-backed engine boundaries.
