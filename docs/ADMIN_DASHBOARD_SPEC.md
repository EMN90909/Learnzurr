LEARNZUR ADMIN DASHBOARD — WHAT IS INSIDE

============================================================
1. ADMIN PURPOSE
============================================================

Admin dashboard controls the full Learnzur platform.

Admin can manage:
- teachers
- parents
- learners
- classes
- teacher verification
- bans and suspensions
- Mearn treasury
- transaction splits
- teacher payouts
- marketplace approvals
- flagged listings
- gamification rules
- contests
- physical events
- sponsors
- NGO applications
- search analytics
- media queue
- platform security
- notifications
- support tickets
- feature flags
- audit logs

Admin actions must be:
- role-protected
- audit-logged
- secure
- traceable
- protected by strict permissions

============================================================
2. ADMIN ROUTE STRUCTURE
============================================================

frontend/
└── src/
    └── routes/
        └── (admin)/
            ├── +layout.svelte
            ├── dashboard/
            │   └── +page.svelte
            ├── users/
            │   ├── teachers/
            │   │   └── +page.svelte
            │   ├── parents/
            │   │   └── +page.svelte
            │   └── learners/
            │       └── +page.svelte
            ├── classes/
            │   └── +page.svelte
            ├── mearn/
            │   ├── overview/
            │   │   └── +page.svelte
            │   ├── splits/
            │   │   └── +page.svelte
            │   ├── payouts/
            │   │   └── +page.svelte
            │   └── treasury/
            │       └── +page.svelte
            ├── lanmat/
            │   ├── pending/
            │   │   └── +page.svelte
            │   └── flagged/
            │       └── +page.svelte
            ├── gamfy/
            │   └── +page.svelte
            ├── contests/
            │   └── +page.svelte
            ├── events/
            │   └── +page.svelte
            ├── sponsors/
            │   └── +page.svelte
            ├── ngo/
            │   └── +page.svelte
            ├── find/
            │   └── +page.svelte
            ├── media/
            │   └── +page.svelte
            ├── security/
            │   └── +page.svelte
            ├── notifications/
            │   └── +page.svelte
            ├── help/
            │   └── +page.svelte
            └── settings/
                └── +page.svelte

============================================================
3. ADMIN PAGES AND WHAT EACH DOES
============================================================

(admin)/+layout.svelte
- Admin dashboard layout.
- Sidebar navigation.
- Top bar.
- Admin role guard.
- Logout button.
- Current admin profile.
- Security warning area if needed.
- Prevents non-admin users from seeing admin pages.

(admin)/dashboard/+page.svelte
Purpose:
- Main admin home.
- Shows live platform stats.

Should show:
- total teachers
- pending teacher approvals
- total parents
- total learners
- total classes
- active live classes
- today’s payments
- pending payouts
- flagged content count
- pending marketplace listings
- open support tickets
- media jobs waiting
- recent security alerts

(admin)/users/teachers/+page.svelte
Purpose:
- Manage teachers.

Admin can:
- view all teachers
- search teachers
- filter by county
- filter by subject
- filter by approval status
- view teacher certificate
- approve teacher
- reject teacher
- suspend teacher
- ban teacher
- view teacher classes
- view teacher earnings summary

Important:
- Teacher certificate approval must be audit-logged.
- Ban/suspension must require reason.
- Teacher cannot teach until approved.

(admin)/users/parents/+page.svelte
Purpose:
- Manage parent accounts.

Admin can:
- view all parents
- search parents
- filter by county
- view linked children count
- view parent payment history summary
- suspend parent
- ban parent
- view support/security flags

Important:
- Admin must not expose children unnecessarily.
- Parent ban must not delete children’s learning history.

(admin)/users/learners/+page.svelte
Purpose:
- Manage learner accounts.

Admin can:
- view learners
- search learners
- filter by age group
- filter by parent
- filter by class
- view enrollment summary
- suspend learner
- ban learner
- view strike/safety history

Important:
- Learners are minors.
- Show limited personal info.
- Protect child data strongly.
- Learner account is created by parent, not public signup.

(admin)/classes/+page.svelte
Purpose:
- Manage all platform classes.

Admin can:
- view all classes
- search classes
- filter by teacher
- filter by subject
- filter by status
- view enrollments
- suspend class
- unsuspend class
- review class reports
- check class pricing

Important:
- Suspending a class should stop new enrollments.
- Existing learners should be handled safely.
- Action must be audit-logged.

(admin)/mearn/overview/+page.svelte
Purpose:
- Mearn treasury overview.

Should show:
- total revenue
- today’s revenue
- monthly revenue
- teacher earnings
- platform fees
- royalty totals
- pending payouts
- failed payments
- refund requests
- treasury pot balances

Important:
- This is financial data.
- Strict admin permission required.
- Audit all views/actions if sensitive.

(admin)/mearn/splits/+page.svelte
Purpose:
- View transaction splits.

Admin can see:
- transaction amount
- teacher share
- learner/seller royalty share
- platform fee
- tax pot
- rewards pot
- founder/internal pot if configured
- split status
- related class/listing
- timestamps

Important:
- Splits must come from backend ledger.
- Do not calculate financial truth in frontend.
- Splits must be immutable where possible.

(admin)/mearn/payouts/+page.svelte
Purpose:
- Approve or reject teacher payouts.

Admin can:
- view payout requests
- filter pending/approved/rejected/paid
- approve payout
- reject payout
- add reason
- see teacher balance
- see M-Pesa payout status

Important:
- Approval requires reason/audit.
- Payout cannot exceed available balance.
- Large payouts may need stronger confirmation.

(admin)/mearn/treasury/+page.svelte
Purpose:
- Manage internal treasury pots.

Should show:
- running cost pot
- rewards pot
- tax pot
- founder/internal pot
- manual adjustments
- treasury history

Admin can:
- view pots
- create adjustment if allowed
- view adjustment history

Important:
- Manual adjustments must be very restricted.
- Every adjustment must be audit-logged.
- Never allow silent edits to ledger records.

(admin)/lanmat/pending/+page.svelte
Purpose:
- Approve/reject marketplace listings.

Admin can:
- view pending listings
- view listing title/description/files
- approve listing
- reject listing
- add rejection reason
- send feedback to seller

Important:
- Listings should be scanned by Flag first.
- Learner sellers need age safety.
- Marketplace approval must be logged.

(admin)/lanmat/flagged/+page.svelte
Purpose:
- Review flagged marketplace content.

Admin can:
- view flagged listings
- view flag reason
- view severity
- remove listing
- approve after review
- suspend seller
- escalate to safety review

Important:
- Child-safety issues must be handled carefully.
- Severe issues should notify relevant parties.

(admin)/gamfy/+page.svelte
Purpose:
- Manage gamification rules.

Admin can:
- manage point values
- manage badges
- manage levels
- manage streak settings
- manage junior/senior age-adaptive rules
- manage leaderboard visibility
- manage reward settings

Important:
- Age groups must not be hardcoded everywhere.
- Gamfy decides junior/senior behavior.
- Changes must be audit-logged.

(admin)/contests/+page.svelte
Purpose:
- Create and manage contests.

Admin can:
- create contest
- edit contest
- open/close contest
- view submissions
- assign judges
- select winners
- manage prizes
- connect sponsors

Important:
- Contest submissions may need moderation.
- Winner selection must be logged.

(admin)/events/+page.svelte
Purpose:
- Create and manage physical events.

Admin can:
- create physical event
- set location
- set capacity
- manage registration
- check in participants
- send event announcements
- close event registration

Important:
- Events are physical, so location/capacity matters.
- Participant lists should be protected.

(admin)/sponsors/+page.svelte
Purpose:
- Manage sponsors.

Admin can:
- create sponsor account
- view sponsor contacts
- manage sponsor contracts
- connect sponsor to contest/event
- view sponsor payments/budget

Important:
- Sponsor data is business-sensitive.
- Contract/payment actions must be logged.

(admin)/ngo/+page.svelte
Purpose:
- Manage NGO applications and verified NGO access.

Admin can:
- view NGO applications
- approve NGO
- reject NGO
- verify NGO details
- grant access/benefits
- view NGO-linked learners/classes if allowed

Important:
- NGO verification must require evidence.
- Access grants must be audit-logged.

(admin)/find/+page.svelte
Purpose:
- Search analytics.

Admin can view:
- popular searches
- zero-result searches
- search filters used
- search performance
- SEO class page issues

Admin can:
- review bad search results
- improve categories/subjects
- monitor discovery problems

Important:
- Search logs should avoid exposing sensitive learner data.

(admin)/media/+page.svelte
Purpose:
- Media queue and storage monitoring.

Admin can see:
- encoding queue
- failed media jobs
- PDF generation jobs
- certificate generation jobs
- storage usage
- large uploads
- media errors

Admin can:
- retry failed jobs
- cancel unsafe jobs
- view storage usage per user/class
- investigate upload abuse

Important:
- Do not expose private files unless authorized.
- Media actions must be logged.

(admin)/security/+page.svelte
Purpose:
- Security center.

Admin can see:
- audit logs
- fraud alerts
- IP blacklist
- user blacklist
- suspicious logins
- suspicious payments
- duplicate payment attempts
- moderation strikes
- sandbox abuse attempts
- classroom abuse events

Admin can:
- block IP
- unblock IP
- restrict user
- remove restriction
- view audit history
- investigate fraud

Important:
- This is highly sensitive.
- Only top-level admins should access some actions.
- Every security action must be audit-logged.

(admin)/notifications/+page.svelte
Purpose:
- Send platform-wide announcements.

Admin can:
- send announcement to all users
- send to teachers only
- send to parents only
- send to learners only
- send county-specific announcement
- send class-specific announcement
- choose push/email/in-app
- view delivery status

Important:
- Announcements must be rate-limited.
- Must respect notification preferences where required.
- Emergency messages should be restricted.

(admin)/help/+page.svelte
Purpose:
- Support tickets and feedback.

Admin can:
- view support tickets
- assign ticket
- reply to ticket
- close ticket
- view platform feedback
- mark issue as bug/feature/payment/security

Important:
- Support may include personal info.
- Replies/actions must be logged.

(admin)/settings/+page.svelte
Purpose:
- Admin system settings.

Admin can manage:
- TOTP reset
- IP whitelist
- feature flags
- platform config
- payout thresholds
- classroom config
- gamfy config
- notification config
- maintenance mode

Important:
- Settings must be role-restricted.
- Dangerous changes require confirmation.
- Every setting change must be audit-logged.

============================================================
4. ADMIN BACKEND AREAS
============================================================

Admin uses multiple backend engines:

Mearn engine:
- treasury
- splits
- payouts
- refunds
- fraud alerts

Lanmat engine:
- pending listings
- flagged listings
- marketplace moderation

Gamfy engine:
- point rules
- badges
- levels
- age-adaptive config

Media engine:
- encoding queue
- PDFs
- certificates
- storage usage

Find engine:
- search analytics
- zero-result queries
- SEO issues

Flag engine:
- flagged content
- strikes
- appeals
- moderation review

Notify engine:
- platform announcements
- delivery logs

Classroom engine:
- live class abuse events
- room audit logs
- meeting/recording monitoring

Core backend:
- users
- roles
- auth
- audit logs
- blacklist
- feature flags

============================================================
5. ADMIN DATABASE AREAS
============================================================

Admin will read/manage data from:

users
- all user roles

teacher_profiles
- teacher approval and certificate status

parent_profiles
- parent management

learner_profiles
- learner management

classes
- all classes

enrollments
- class membership

transactions
- payments

transaction_splits
- financial splits

teacher_balances
- available/held balances

treasury_pots
- platform internal pots

payout_requests
- teacher payouts

lanmat_listings
- marketplace listings

lanmat_reports
- reported marketplace items

gamfy_config
- gamification settings

age_adaptive_config
- junior/senior UI reward rules

contests
- platform contests

contest_submissions
- contest entries

events
- physical events

event_registrations
- event participants

sponsors
- sponsor accounts

ngo_applications
- NGO verification

search_logs
- search analytics

media_jobs
- rendering/encoding jobs

storage_usage
- media storage usage

flag_records
- moderation records

user_strikes
- strike history

flag_appeals
- appeals

audit_logs
- global sensitive action logs

fraud_flags
- suspicious payment/security activity

feature_flags
- platform feature switches

support_tickets
- user help requests

feedback
- platform feedback

============================================================
6. ADMIN SECURITY RULES
============================================================

Admin pages must follow these rules:

1. Only admin role can access admin dashboard.
2. Sensitive areas may require super-admin permission.
3. Every admin action must be audit-logged.
4. Payment actions require stronger confirmation.
5. Payout approvals must require reason.
6. User bans must require reason.
7. Teacher rejection must require reason.
8. Marketplace rejection must require reason.
9. Treasury adjustment must require reason.
10. Security blacklist action must require reason.
11. Admin cannot silently edit financial ledger records.
12. Admin cannot delete audit logs.
13. Admin cannot expose learner private data unnecessarily.
14. Learner data must be minimized.
15. Admin notification blasts must be rate-limited.
16. Admin actions must use safe error messages.
17. Admin pages must not leak secrets.
18. Admin must not see raw passwords, PINs, OTPs, or tokens.
19. Admin must not access private files without permission.
20. Admin role changes must be logged.
21. Feature flag changes must be logged.
22. Payout changes must be logged.
23. Teacher verification actions must be logged.
24. Class suspension actions must be logged.
25. Marketplace moderation actions must be logged.
26. Contest winner actions must be logged.
27. Event check-in actions must be logged.
28. NGO approval actions must be logged.
29. Security restriction actions must be logged.
30. Admin settings changes must be logged.
31. Use pagination on all admin lists.
32. Use filters safely.
33. Prevent SQL injection in admin search/filter.
34. Use prepared statements only.
35. Use RLS policies where applicable.
36. Use backend authorization, not frontend-only guards.
37. Mask phone/email where possible.
38. Encrypt sensitive fields.
39. Use HTTPS only.
40. Use secure cookies and no localStorage tokens.

============================================================
7. SIMPLE ADMIN SUMMARY
============================================================

Admin dashboard contains:

dashboard
- platform stats

users/teachers
- verify, approve, reject, suspend, ban teachers

users/parents
- manage parent accounts

users/learners
- manage learner accounts safely

classes
- view and suspend classes

mearn/overview
- financial overview

mearn/splits
- transaction split records

mearn/payouts
- approve/reject teacher payouts

mearn/treasury
- internal treasury pots

lanmat/pending
- approve/reject marketplace listings

lanmat/flagged
- review flagged marketplace content

gamfy
- manage points, badges, streaks, age-adaptive rules

contests
- create/manage contests

events
- create/manage physical events

sponsors
- manage sponsors

ngo
- verify NGO applications

find
- search analytics

media
- encoding queue and storage usage

security
- audit logs, fraud alerts, blacklist

notifications
- platform announcements

help
- support tickets and feedback

settings
- TOTP, IP whitelist, feature flags, system config

Admin is the highest-control dashboard.
It must be strict, secure, audited, and protected.