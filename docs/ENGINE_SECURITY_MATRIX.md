# Learnzur Engine Security Proof
This file confirms every engine security file has been replaced with the requested engine-specific 40-rule set.
## gamfy
- File: `backend/engines/gamfy/internal/gamfy/security.go`
- Protects: rewards, points, badges, streaks, leaderboard
- Rule count: 40
- Rules:
  1. Verify user is authenticated before awarding points
  2. Confirm learner owns the gamfy profile
  3. Prevent duplicate point awards for the same action
  4. Use idempotency keys for point transactions
  5. Validate action type before awarding points
  6. Reject unknown gamification actions
  7. Prevent client from sending raw point values
  8. Points must come from server-side rules only
  9. Validate badge criteria before unlock
  10. Prevent duplicate badge unlocks
  11. Lock streak update per learner per day
  12. Prevent manual streak manipulation
  13. Validate timezone for daily streaks
  14. Prevent future-date streak activity
  15. Prevent backdated streak abuse
  16. Log every point award
  17. Log every badge unlock
  18. Log every streak reset
  19. Audit admin changes to gamfy rules
  20. Rate-limit reward claims
  21. Prevent leaderboard score tampering
  22. Recalculate leaderboard from trusted point records
  23. Prevent negative point injection
  24. Prevent overflow point values
  25. Validate learner age group before age-adaptive reward
  26. Protect junior learners from public ranking exposure
  27. Hide sensitive learner identity on leaderboards
  28. Restrict admin-only gamfy config endpoints
  29. Require role check for admin rule changes
  30. Use DB transactions for points and badge updates
  31. Roll back reward if related learning action fails
  32. Prevent repeated reward from replayed RPC calls
  33. Sign internal RPC requests
  34. Validate RPC caller engine
  35. Reject expired internal RPC tokens
  36. Cache only non-sensitive leaderboard data
  37. Invalidate leaderboard cache after point changes
  38. Detect suspicious point farming
  39. Flag abnormal reward activity
  40. Write immutable audit logs for all reward changes

## mearn
- File: `backend/engines/mearn/internal/mearn/security.go`
- Protects: payments, M-Pesa, earnings, payouts, treasury
- Rule count: 40
- Rules:
  1. Verify user authentication before payment action
  2. Validate payer role before class payment
  3. Validate teacher role before payout request
  4. Never trust payment amount from frontend alone
  5. Recalculate payable amount on backend
  6. Validate class price from database
  7. Validate marketplace price from database
  8. Use idempotency key for STK push
  9. Prevent duplicate payment requests
  10. Store pending payment before calling Daraja
  11. Verify Daraja callback signature/source
  12. Validate callback transaction reference
  13. Reject unknown M-Pesa receipt numbers
  14. Prevent duplicate callback processing
  15. Store raw callback for audit
  16. Use DB transaction for payment confirmation
  17. Process transaction splits atomically
  18. Prevent negative split amounts
  19. Validate split percentages total correctly
  20. Protect treasury pot updates with transactions
  21. Prevent teacher from editing balance
  22. Prevent payout above available balance
  23. Hold balance until refund window passes
  24. Rate-limit payout requests
  25. Require admin approval for large payouts
  26. Validate M-Pesa phone format
  27. Encrypt sensitive phone/payment fields
  28. Mask phone numbers in logs
  29. Never log payment secrets
  30. Store Daraja credentials in environment only
  31. Rotate Daraja access tokens securely
  32. Detect rapid repeated payments
  33. Detect same receipt reused across users
  34. Detect suspicious refund patterns
  35. Require admin role for treasury adjustments
  36. Audit every payout decision
  37. Audit every split calculation
  38. Audit every refund
  39. Sign internal RPC payment calls
  40. Reject expired or unsigned engine RPC requests

## lms
- File: `backend/engines/lms/internal/lms/security.go`
- Protects: quizzes, tests, assignments, submissions, grades
- Rule count: 40
- Rules:
  1. Verify user authentication
  2. Check learner enrollment before access
  3. Check teacher owns class before editing LMS content
  4. Prevent parent from submitting learner work
  5. Prevent learner from creating quizzes/tests
  6. Enforce quiz availability window
  7. Enforce test availability window
  8. Enforce assignment deadline
  9. Prevent duplicate quiz submission
  10. Prevent duplicate test submission
  11. Prevent duplicate assignment submission unless allowed
  12. Use server time for deadlines
  13. Ignore client-submitted timestamps
  14. Validate question belongs to quiz/test
  15. Validate submitted answer format
  16. Prevent answer injection for hidden correct answers
  17. Never send correct answers before submission closes
  18. Hide grade until teacher/policy releases it
  19. Prevent learner from changing score
  20. Prevent teacher from grading outside owned class
  21. Audit grade changes
  22. Store grade history
  23. Detect suspicious rapid submissions
  24. Detect impossible completion time
  25. Rate-limit submission attempts
  26. Sanitize assignment text
  27. Scan uploaded assignment files through Media/Flag
  28. Validate file type for assignment uploads
  29. Limit assignment upload size
  30. Prevent SQL injection in gradebook filters
  31. Use pagination for gradebook access
  32. Protect learner progress from other learners
  33. Parent can only view linked child progress
  34. Sign internal Gamfy award RPC calls
  35. Sign internal Notify grade RPC calls
  36. Retry notification safely without duplicate grade changes
  37. Use transaction for submit, grade, and reward
  38. Lock submission row during grading
  39. Audit quiz/test publishing
  40. Audit assignment deadline changes

## classroom
- File: `backend/engines/classroom/internal/classroom/security.go`
- Protects: live classes, WebRTC, board, attendance, meetings
- Rule count: 40
- Rules:
  1. Verify user authentication before joining room
  2. Check learner enrollment before joining class
  3. Check teacher owns class before starting room
  4. Generate signed room join tokens
  5. Expire room tokens quickly
  6. Prevent token reuse after session ends
  7. Validate room status before join
  8. Prevent banned users from joining
  9. Limit participants per room
  10. Limit camera slots per room
  11. Prevent learner from forcing teacher controls
  12. Validate WebSocket origin
  13. Require auth on WebSocket upgrade
  14. Rate-limit WebSocket messages
  15. Validate board event shape
  16. Prevent oversized board payloads
  17. Prevent board spam/flooding
  18. Store board state safely in Redis
  19. Sanitize classroom chat messages
  20. Send chat through Flag engine before delivery
  21. Block unsafe chat if flag returns high severity
  22. Audit deleted chat messages
  23. Prevent learner from marking own attendance
  24. Calculate attendance server-side
  25. Track disconnect/reconnect honestly
  26. Prevent attendance backdating
  27. Protect meeting links from non-members
  28. Prevent unauthorized recording access
  29. Require consent/policy for recordings
  30. Signed URLs for recordings only
  31. Rate-limit hand raises
  32. Rate-limit reconnect attempts
  33. Prevent duplicate participant sessions
  34. Kick old session on duplicate login if needed
  35. Use TURN/STUN config securely
  36. Never expose private WebRTC credentials publicly
  37. Sign internal Gamfy attendance RPC
  38. Sign internal Notify class reminder RPC
  39. Audit room start/end events
  40. Audit participant removal or ban actions

## san
- File: `backend/engines/san/internal/san/security.go`
- Protects: coding sandbox and learner projects
- Rule count: 40
- Rules:
  1. Verify user authentication
  2. Check learner owns project before edit
  3. Validate project language
  4. Allow only supported runners
  5. Reject unknown runtime images
  6. Run code in isolated container
  7. Disable container network
  8. Block host filesystem mounts
  9. Use read-only base filesystem where possible
  10. Set CPU limit
  11. Set memory limit
  12. Set process limit
  13. Set execution timeout
  14. Hard-kill long-running containers
  15. Remove container after execution
  16. Prevent shell escape commands
  17. Sanitize dangerous imports/modules
  18. Block filesystem traversal
  19. Block access to environment secrets
  20. Strip secrets from execution output
  21. Limit stdout size
  22. Limit stderr size
  23. Rate-limit code executions
  24. Prevent fork bombs
  25. Prevent infinite output loops
  26. Prevent container privilege escalation
  27. Run as non-root user
  28. Use seccomp/AppArmor where available
  29. Disable Docker socket access
  30. Validate project title/content length
  31. Sanitize project descriptions
  32. Scan public shared projects with Flag
  33. Prevent learners from editing others’ projects
  34. Protect private projects from public access
  35. Use signed share links
  36. Expire temporary run sessions
  37. Audit every execution
  38. Audit resource violations
  39. Cache runner config safely
  40. Alert admin on repeated sandbox violations

## lanmat
- File: `backend/engines/lanmat/internal/lanmat/security.go`
- Protects: marketplace, purchases, approvals, royalties
- Rule count: 40
- Rules:
  1. Verify user authentication
  2. Check seller eligibility before listing
  3. Enforce age rules for learner sellers
  4. Require parent approval for child purchases
  5. Require admin approval before listing goes live
  6. Scan listing title with Flag
  7. Scan listing description with Flag
  8. Scan listing files through Media/Flag
  9. Reject prohibited marketplace items
  10. Validate listing category
  11. Validate price minimum
  12. Validate price maximum
  13. Prevent seller from buying own item
  14. Prevent duplicate purchase processing
  15. Use Mearn for payment confirmation only
  16. Never trust frontend payment status
  17. Verify purchase belongs to buyer
  18. Use signed URLs for purchased files
  19. Prevent unpaid file download
  20. Expire download links
  21. Protect seller identity for minors
  22. Hide child seller private info
  23. Rate-limit listing submissions
  24. Rate-limit purchase attempts
  25. Detect suspicious repeated purchases
  26. Detect fake review attempts
  27. Only verified buyers can review
  28. Prevent duplicate reviews per purchase
  29. Audit listing approval/rejection
  30. Audit purchase fulfillment
  31. Audit royalty calculation
  32. Validate royalty split before payout
  33. Sign RPC call to Flag engine
  34. Sign RPC call to Mearn engine
  35. Sign RPC call to Notify engine
  36. Prevent listing edits after approval without re-review
  37. Keep listing version history
  38. Allow admin takedown of unsafe listings
  39. Restrict admin marketplace actions by role
  40. Store immutable marketplace audit logs

## notify
- File: `backend/engines/notify/internal/notify/security.go`
- Protects: push notifications, emails, reminders
- Rule count: 40
- Rules:
  1. Verify user authentication for subscription changes
  2. Validate push subscription endpoint
  3. Prevent duplicate subscriptions
  4. Encrypt or protect push subscription keys
  5. Validate notification recipient exists
  6. Ensure user can only read own notifications
  7. Parent can only receive child-related alerts if linked
  8. Teacher can only notify own class
  9. Admin-only platform-wide announcements
  10. Rate-limit notification sends
  11. Rate-limit email sends
  12. Prevent notification spam loops
  13. Respect notification preferences
  14. Respect unsubscribe tokens
  15. Validate unsubscribe token expiry
  16. Prevent sending to unsubscribed email
  17. Sanitize notification title
  18. Sanitize notification body
  19. Prevent HTML/script injection in emails
  20. Use safe email templates only
  21. Never expose OTP in logs
  22. Never expose reset tokens in logs
  23. Hash unsubscribe/reset tokens
  24. Expire scheduled notification safely
  25. Prevent duplicate scheduled reminders
  26. Use idempotency key for notifications
  27. Sign internal RPC notification requests
  28. Validate calling engine
  29. Reject unknown notification type
  30. Restrict urgent alerts to trusted engines
  31. Store delivery logs
  32. Avoid storing sensitive message payloads unnecessarily
  33. Mask emails in logs
  34. Validate SMTP credentials from env only
  35. Validate VAPID keys from env only
  36. Retry failed sends safely
  37. Prevent infinite retry loops
  38. Audit admin announcements
  39. Audit failed critical alerts
  40. Alert admin on notification abuse patterns

## media
- File: `backend/engines/media/internal/media/security.go`
- Protects: uploads, videos, PDFs, certificates, storage
- Rule count: 40
- Rules:
  1. Verify user authentication before upload
  2. Check user owns uploaded asset
  3. Validate MIME type
  4. Validate file extension
  5. Validate file size
  6. Reject executable files
  7. Reject dangerous archive formats if unsupported
  8. Scan uploaded files for unsafe content
  9. Strip metadata from images/videos where needed
  10. Generate safe storage filenames
  11. Prevent path traversal
  12. Store files outside public root
  13. Use signed URLs for private assets
  14. Expire signed URLs
  15. Prevent unauthorized downloads
  16. Check class/material ownership before access
  17. Parent can only access child reports
  18. Teacher can only access own class materials
  19. Validate video encoding job ownership
  20. Prevent duplicate encoding jobs
  21. Limit encoding duration
  22. Limit FFmpeg CPU/memory usage
  23. Sanitize FFmpeg inputs
  24. Never pass raw user input into shell commands
  25. Use argument arrays instead of shell strings
  26. Validate PDF template names
  27. Prevent HTML injection in PDF templates
  28. Sanitize certificate/report data
  29. Prevent fake certificate generation
  30. Validate certificate issuer authority
  31. Audit certificate creation
  32. Audit report card PDF creation
  33. Audit file deletion
  34. Prevent user from deleting another user’s asset
  35. Rate-limit uploads
  36. Rate-limit render jobs
  37. Enforce user storage quota
  38. Detect suspicious upload patterns
  39. Sign internal RPC media requests
  40. Store immutable media job logs

## find
- File: `backend/engines/find/internal/find/security.go`
- Protects: search, suggestions, SEO class pages
- Rule count: 40
- Rules:
  1. Sanitize search query
  2. Trim query length
  3. Reject dangerous characters where needed
  4. Prevent SQL injection
  5. Use parameterized search queries
  6. Rate-limit search requests
  7. Rate-limit suggestions
  8. Prevent scraping through pagination abuse
  9. Limit page size
  10. Use cursor pagination
  11. Hide private classes from public search
  12. Hide suspended classes
  13. Hide banned teachers
  14. Hide under-review content
  15. Respect class visibility rules
  16. Do not expose learner data in search
  17. Do not expose parent data in search
  18. Do not expose private teacher contact details
  19. Sanitize search result snippets
  20. Sanitize SSR metadata
  21. Prevent XSS in SEO descriptions
  22. Validate class ID before SSR rendering
  23. Prevent SSR access to private class pages
  24. Cache only public-safe search results
  25. Invalidate search cache after class status change
  26. Validate filters against allowed list
  27. Reject unknown sort fields
  28. Prevent ranking manipulation from frontend
  29. Log zero-result queries safely
  30. Avoid storing sensitive search queries where possible
  31. Mask user identity in analytics
  32. Restrict admin analytics by role
  33. Sign internal RPC request to Media
  34. Validate media asset response before using
  35. Prevent open redirect in search links
  36. Prevent malicious URL injection
  37. Audit admin search config changes
  38. Detect bot-like query patterns
  39. Temporarily block abusive IP/user
  40. Protect search indexes from unauthorized writes

## flag
- File: `backend/engines/flag/internal/flag/security.go`
- Protects: moderation, AI scanning, rule scanning, strikes, appeals
- Rule count: 40
- Rules:
  1. Verify internal caller before scan request
  2. Sign all scan RPC requests
  3. Validate calling engine name
  4. Validate content type before scanning
  5. Sanitize content before rule scanning
  6. Limit content size for scanning
  7. Rate-limit scan requests
  8. Prevent scan queue flooding
  9. Use safe timeout for AI provider calls
  10. Fail safely based on content type
  11. For critical content, block if scan fails
  12. For low-risk chat, allow or queue based on policy
  13. Never expose AI provider keys
  14. Never log full sensitive child messages unnecessarily
  15. Mask personal data in moderation logs where possible
  16. Store full evidence only when policy requires
  17. Protect moderation records from normal users
  18. Allow user to view only their own appeal status
  19. Restrict flag review to admin/moderator roles
  20. Audit every moderator action
  21. Audit every strike
  22. Audit every appeal decision
  23. Prevent duplicate strikes for same content
  24. Use idempotency key for scan result
  25. Validate severity values
  26. Validate moderation category
  27. Prevent user from removing own strike
  28. Enforce strike expiry rules
  29. Enforce restriction expiry rules
  30. Prevent banned user from posting
  31. Keep keyword blacklist admin-only
  32. Validate blacklist pattern safety
  33. Prevent dangerous regex patterns
  34. Cache blacklist safely
  35. Refresh blacklist after admin update
  36. Detect repeated unsafe behavior
  37. Escalate severe child-safety flags
  38. Notify user/parent/admin based on severity
  39. Sign internal Notify RPC calls
  40. Store immutable flag audit trail

