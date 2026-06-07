# Struta to Learnzur Migration Guide

## Role mapping

| Struta role/dashboard | Learnzur role/dashboard | Decision |
|---|---|---|
| Bereaved / Family (`/family`, `/signup/family`, memorial tools) | Learner (`/dashboard/learner`) | Rebuild. Learners need class, library, projects, gamification, contests, chat. |
| Vendor / Marketplace (`/marketplace`, `/vendor/*`) | Teacher (`/dashboard/teacher`) | Rebuild. Vendor catalog/order ideas become teacher materials and Lanmat listings. |
| Funeral home / Operations (`/operations`, `/manager/*`) | Parent (`/dashboard/parent`) | Rebuild. Cases/payments/schedules become child oversight, enrollment, progress, payments. |
| Admin (`/admin/*`) | Admin (`/dashboard/admin`) | Rebuild with stricter audit logs and education/payment moderation. |

## Route transformation matrix

| Old Struta route | New Learnzur route | Old role | New role | Old data model | New data model | Reusable code | Delete/rebuild | Required APIs | RLS/permissions |
|---|---|---|---|---|---|---|---|---|---|
| `/login` | `/login` | all | parent/teacher/learner tabs | Supabase user_profiles | parent/teacher password accounts + learner PIN accounts | validation and safe error pattern | React UI and localStorage session patterns | `/api/auth/login`, `/api/auth/pin/login` | own profile only, session rotation |
| `/signup/family` | `/register/parent` | family | parent | user_profiles role family | parents, parent_profiles | multi-step idea | all funeral copy | `/api/auth/signup/parent`, OTP APIs | parent owns children |
| `/signup/vendor` | `/register/teacher` | marketplace vendor | teacher | vendor profile/payment fields | teachers, certificates, subjects | certificate/profile concept | vendor catalog language | `/api/auth/signup/teacher` | admin verifies certificate |
| `/family` | `/dashboard/learner` | bereaved/family | learner | memorials, requests | learners, enrollments, gamfy state | dashboard shell concept | memorial widgets | `/api/lms/learner/summary`, `/api/gamfy/summary` | learner own data; parent read child |
| `/family/search` | `/dashboard/learner/library` and public explore | family | learner/public | provider discovery | library resources/classes/projects | search UX idea | provider funeral filters | `/api/find/search` | published resources only |
| `/family/requests` | `/dashboard/learner/tasks/*` | family | learner | service_requests | assignments, quizzes, tests | status list concept | request funeral model | `/api/lms/tasks` | assigned learner only |
| `/family/chats` | `/dashboard/learner/chat` | family | learner | request chats | class chat | realtime concept | funeral participants | `/api/classroom/chat` | class members only |
| `/family/memorials` | `/dashboard/learner/create/*` | family | learner | memorial pages | projects/media/sandbox | publishing concept | memorial fields | `/api/san/projects`, `/api/media/jobs` | child safety policies |
| `/operations` | `/dashboard/parent` | funeral home | parent | service operations | children overview/progress | dashboard cards | provider KPIs | `/api/parent/summary` | parent children only |
| `/operations/cases` | `/dashboard/parent/progress/[id]` | funeral home | parent | cases | progress, attendance, grades | status timeline concept | funeral cases | `/api/lms/progress/{child}` | parent-child ownership |
| `/operations/inventory` | `/dashboard/parent/classes` | funeral home | parent | inventory | enrollments/classes | none | inventory tables | `/api/classes`, `/api/enrollments` | parent enrollment access |
| `/operations/billing` | `/dashboard/parent/payments/*` | funeral home/family/vendor | parent | payments/subscriptions | Mearn transactions, enrollments, Lanmat approvals | audit/payment request pattern | PayPal plan copy | `/api/mearn/stk-push`, `/api/mearn/history` | parent own payments |
| `/marketplace` | `/dashboard/teacher` | vendor | teacher | listings/orders | teacher classes/earnings | seller dashboard idea | vendor funeral widgets | `/api/teacher/summary` | teacher own classes |
| `/marketplace/catalog` | `/dashboard/teacher/classes` | vendor | teacher | catalog items | classes | CRUD table idea | product categories | `/api/classes` | teacher owner/co-teacher |
| `/marketplace/inventory` | `/dashboard/teacher/lanmat` | vendor | teacher | inventory | notes/books/projects listings | upload/listing idea | stock model | `/api/lanmat/listings` | seller/moderator policies |
| `/marketplace/orders` | `/dashboard/teacher/earnings` | vendor | teacher | orders | ledger earnings/splits | status + filters | order fulfillment | `/api/mearn/earnings` | teacher own ledger view |
| `/manager/vehicles` | delete | operations | none | fleet/vehicles | none | none | remove | none | none |
| `/admin/payments` | `/dashboard/admin/mearn/overview` | admin | admin | payment requests | treasury, splits, payouts | admin verification concept | provider plan copy | `/api/admin/mearn/*` | admin-only + audit |
| `/admin/reports` | `/dashboard/admin/find` | admin | admin | reports | analytics/search reports | charts concept | funeral metrics | `/api/admin/find/analytics` | admin-only |
| `/memorial/:slug` | public `/explore`/project pages | public | public | memorial | public project/class/resource | public SSR idea | memorial model | `/api/find/public` | published-only |
| `/invitation/:token` | class/contest invite later | family | learner/parent | invitations | enrollment/contest invite | token claim concept | funeral copy | `/api/invitations/claim` | token + target checks |

## Tables to retire or not port directly

`memorials`, funeral case tables, funeral inventory, vehicle/fleet tables, embalmer/driver/coordinator staff dashboards, PayPal plan tables, and funeral provider catalog tables should not be renamed in place. Data migration, if needed, must be scripted explicitly after table-level mapping is approved.

## Initial implementation phases

1. Land documentation and empty-but-runnable SvelteKit/Go/Docker skeleton.
2. Implement auth endpoints and first migration group.
3. Implement Mearn ledger and Daraja adapters behind test doubles.
4. Build teacher/parent/learner/admin dashboards incrementally.
5. Add engines one at a time with tests, queues, limits, and audit logs.
