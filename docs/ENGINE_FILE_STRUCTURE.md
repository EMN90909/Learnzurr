# Learnzur Engine File Structure

This document mirrors the requested engine layout and describes how each engine communicates through RPC, Redis queues and PostgreSQL table groups.

backend/
└── engines/
    ├── gamfy/                         # Gamification engine: points, badges, streaks, leaderboard
    │   ├── cmd/
    │   │   └── gamfy/
    │   │       └── main.go            # Starts the Gamfy engine service
    │   └── internal/
    │       └── gamfy/
    │           ├── handler.go         # Handles /api/gamfy/* requests
    │           ├── service.go         # Award points, unlock badges, update streaks
    │           ├── repository.go      # Reads/writes gamification data in PostgreSQL
    │           ├── models.go          # Gamfy structs: Badge, Streak, Points, Leaderboard
    │           ├── rpc.go             # Allows LMS/Classroom to call Gamfy internally
    │           ├── jobs.go            # Handles async point/badge/streak jobs
    │           ├── cache.go           # Caches leaderboard and streak data in Redis
    │           ├── security.go        # Prevents fake points, duplicate rewards, tampering
    │           └── speed.go           # Optimizes leaderboard, streaks, and batch point awards
    │
    ├── mearn/                         # Money engine: payments, earnings, payouts, M-Pesa
    │   ├── cmd/
    │   │   └── mearn/
    │   │       └── main.go            # Starts the Mearn engine service
    │   └── internal/
    │       └── mearn/
    │           ├── handler.go         # Handles /api/mearn/* payment and payout requests
    │           ├── service.go         # STK push, payment status, splits, payout workflow
    │           ├── repository.go      # Reads/writes transactions, splits, balances, payouts
    │           ├── models.go          # Transaction, Split, PayoutRequest, TreasuryPot structs
    │           ├── daraja.go          # Safaricom Daraja M-Pesa API client
    │           ├── rpc.go             # Lets Lanmat/Class enrollment call payment functions
    │           ├── jobs.go            # Processes payout jobs and payment reconciliation
    │           ├── cache.go           # Caches payment status and pending STK push state
    │           ├── security.go        # Verifies callbacks, prevents duplicate payments/fraud
    │           └── speed.go           # Optimizes payment lookups, status checks, DB writes
    │
    ├── lms/                           # Learning engine: quizzes, tests, assignments, grades
    │   ├── cmd/
    │   │   └── lms/
    │   │       └── main.go            # Starts the LMS engine service
    │   └── internal/
    │       └── lms/
    │           ├── handler.go         # Handles /api/lms/* requests
    │           ├── service.go         # Main quiz, test, assignment, and grade logic
    │           ├── repository.go      # Reads/writes LMS tables in PostgreSQL
    │           ├── models.go          # Quiz, Question, Submission, Assignment, Grade structs
    │           ├── grader.go          # Auto-grades quizzes/tests and calculates scores
    │           ├── rpc.go             # Calls Gamfy for points and Notify for alerts
    │           ├── jobs.go            # Runs reminders, auto-grade jobs, report generation jobs
    │           ├── cache.go           # Caches gradebook, quizzes, progress summaries
    │           ├── security.go        # Enforces deadlines, one submission, anti-cheat rules
    │           └── speed.go           # Optimizes grading, gradebook loading, batch updates
    │
    ├── classroom/                     # Live classroom engine: WebRTC, board, meetings, attendance
    │   ├── cmd/
    │   │   └── classroom/
    │   │       └── main.go            # Starts the Classroom engine service
    │   └── internal/
    │       └── classroom/
    │           ├── handler.go         # Handles classroom routes and WebSocket connections
    │           ├── service.go         # Creates rooms, joins users, ends classes, tracks sessions
    │           ├── repository.go      # Reads/writes rooms, attendance, participants, meetings
    │           ├── models.go          # Room, Participant, Attendance, Meeting structs
    │           ├── webrtc.go          # Handles live video/audio streaming with WebRTC
    │           ├── board.go           # Manages shared whiteboard drawing state
    │           ├── rpc.go             # Calls Gamfy, Notify, and Flag internally
    │           ├── jobs.go            # Class reminder jobs, room cleanup, attendance jobs
    │           ├── cache.go           # Stores live room state and participants in Redis
    │           ├── security.go        # Room access, camera limits, token checks, chat safety
    │           └── speed.go           # Optimizes live state, reconnects, WebSocket performance
    │
    ├── san/                           # Sandbox/code engine: learner coding, execution, projects
    │   ├── cmd/
    │   │   └── san/
    │   │       └── main.go            # Starts the San engine service
    │   └── internal/
    │       └── san/
    │           ├── handler.go         # Handles /api/san/* code/project requests and SSE output
    │           ├── service.go         # Executes code, saves projects, loads projects
    │           ├── repository.go      # Reads/writes code projects and execution logs
    │           ├── models.go          # Project, CodeSession, ExecutionLog structs
    │           ├── docker.go          # Runs code inside isolated Docker containers
    │           ├── sanitizer.go       # Blocks unsafe code patterns and restricted actions
    │           ├── rpc.go             # Allows other engines to request project/code actions
    │           ├── jobs.go            # Handles long-running execution or cleanup jobs
    │           ├── cache.go           # Caches runner settings and recent execution state
    │           ├── security.go        # No network, no host filesystem, time/memory limits
    │           └── speed.go           # Uses warm containers, pre-pulled images, stream output
    │
    ├── lanmat/                        # Marketplace engine: listings, purchases, approvals, royalties
    │   ├── cmd/
    │   │   └── lanmat/
    │   │       └── main.go            # Starts the Lanmat engine service
    │   └── internal/
    │       └── lanmat/
    │           ├── handler.go         # Handles /api/lanmat/* marketplace requests
    │           ├── service.go         # Submit listing, approve listing, buy item, fulfill purchase
    │           ├── repository.go      # Reads/writes listings, purchases, approvals, royalties
    │           ├── models.go          # Listing, Purchase, RoyaltySplit, Approval structs
    │           ├── rpc.go             # Calls Flag before publish, Mearn for payments, Notify for alerts
    │           ├── jobs.go            # Approval, fulfillment, royalty, and payout jobs
    │           ├── cache.go           # Caches listings, categories, search results
    │           ├── security.go        # Age gates, parent approval, listing moderation
    │           └── speed.go           # Optimizes listing search, signed URLs, purchase flow
    │
    ├── notify/                        # Notification engine: push, email, reminders, alerts
    │   ├── cmd/
    │   │   └── notify/
    │   │       └── main.go            # Starts the Notify engine service
    │   └── internal/
    │       └── notify/
    │           ├── handler.go         # Handles /api/notify/* subscription and notification requests
    │           ├── service.go         # Sends push notifications, emails, scheduled reminders
    │           ├── repository.go      # Reads/writes notifications, logs, preferences, subscriptions
    │           ├── models.go          # Notification, PushSubscription, ScheduledNotification structs
    │           ├── vapid.go           # Web Push/VAPID notification signing and sending
    │           ├── smtp.go            # Email sending through SMTP
    │           ├── rpc.go             # Lets all engines send notifications internally
    │           ├── jobs.go            # Push/email/digest/reminder queue jobs
    │           ├── cache.go           # Caches notification preferences and unread counts
    │           ├── security.go        # Rate limits, unsubscribe handling, consent checks
    │           └── speed.go           # Batches notifications and reuses delivery connections
    │
    ├── media/                         # Media engine: uploads, videos, animations, PDFs, storage
    │   ├── cmd/
    │   │   └── media/
    │   │       └── main.go            # Starts the Media engine service
    │   └── internal/
    │       └── media/
    │           ├── handler.go         # Handles /api/media/* uploads, renders, downloads
    │           ├── service.go         # Queues video encoding, PDF generation, animation/movie rendering
    │           ├── repository.go      # Reads/writes media jobs, assets, storage records
    │           ├── models.go          # MediaJob, Asset, AnimationProject, MovieProject structs
    │           ├── encoder.go         # Uses FFmpeg to encode videos and process clips
    │           ├── pdf.go             # Generates report cards, certificates, and receipts as PDFs
    │           ├── storage.go         # Saves files and returns secure/signed asset URLs
    │           ├── rpc.go             # Lets Find/Notify/other engines request media assets
    │           ├── jobs.go            # Encoding, thumbnail, PDF, animation render jobs
    │           ├── cache.go           # Caches media status, URLs, thumbnails
    │           ├── security.go        # MIME checks, file size limits, virus-safe upload rules
    │           └── speed.go           # Optimizes FFmpeg presets, queues, CDN/storage usage
    │
    ├── find/                          # Search engine: class search, suggestions, SEO pages
    │   ├── cmd/
    │   │   └── find/
    │   │       └── main.go            # Starts the Find engine service
    │   └── internal/
    │       └── find/
    │           ├── handler.go         # Handles /api/find/* search and suggestion requests
    │           ├── service.go         # Search classes, generate suggestions, log queries
    │           ├── repository.go      # Runs search queries using PostgreSQL/pg_trgm
    │           ├── models.go          # SearchResult, SearchFilter, SearchLog structs
    │           ├── ssr.go             # Builds SEO-ready class detail data/pages
    │           ├── rpc.go             # Calls Media when SEO pages need rendered assets
    │           ├── jobs.go            # Search indexing, cache refresh, analytics jobs
    │           ├── cache.go           # Caches popular searches and search results
    │           ├── security.go        # Sanitizes search input and prevents injection
    │           └── speed.go           # Optimizes search ranking, indexes, cursor pagination
    │
    └── flag/                          # Moderation engine: AI scan, rule scan, strikes, appeals
        ├── cmd/
        │   └── flag/
        │       └── main.go            # Starts the Flag engine service
        └── internal/
            └── flag/
                ├── handler.go         # Handles /api/flag/* moderation requests
                ├── service.go         # Routes content to scanners and applies moderation results
                ├── repository.go      # Reads/writes flags, strikes, appeals, restrictions
                ├── models.go          # Flag, Strike, ScanResult, Appeal structs
                ├── ai_scanner.go      # Uses AI providers to scan unsafe content
                ├── rule_scanner.go    # Uses regex/rules/keyword blacklist
                ├── lanmat_scanner.go  # Marketplace-specific listing scanner
                ├── strike.go          # Adds strikes, restrictions, suspensions
                ├── rpc.go             # Lets Classroom and Lanmat request scans internally
                ├── jobs.go            # Async chat/listing/content scan jobs
                ├── cache.go           # Caches keyword lists and scan settings
                ├── security.go        # Audits all flags, protects minors, prevents bypasses
                └── speed.go           # Speeds scanning with queues, batching, cached rules