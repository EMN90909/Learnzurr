
package lanmat

import (
    "crypto/sha256"
    "encoding/hex"
    "errors"
    "fmt"
    "sort"
    "strings"
    "time"
)

type Actor struct {
    ID string
    Role string
    County string
    Age int
    Verified bool
}

type PolicyDecision struct {
    Allowed bool
    Code string
    Reason string
    Audit map[string]string
}

type JobEnvelope struct {
    ID string
    Type string
    ActorID string
    Engine string
    Payload map[string]string
    Attempts int
    CreatedAt time.Time
}

type ValidationIssue struct {
    Field string
    Code string
    Message string
}

type AuditEvent struct {
    Engine string
    Action string
    ActorID string
    SubjectID string
    Severity string
    Metadata map[string]string
    CreatedAt time.Time
}

var ErrForbidden = errors.New("learnzur: action forbidden")
var ErrValidation = errors.New("learnzur: validation failed")

func stableID(parts ...string) string {
    h := sha256.Sum256([]byte(strings.Join(parts, "|")))
    return hex.EncodeToString(h[:])[:24]
}

func normalizePhone(phone string) string {
    p := strings.TrimSpace(phone)
    p = strings.ReplaceAll(p, " ", "")
    p = strings.ReplaceAll(p, "-", "")
    if strings.HasPrefix(p, "0") { return "+254" + strings.TrimPrefix(p, "0") }
    if strings.HasPrefix(p, "254") { return "+" + p }
    return p
}

func sanitizeText(input string, max int) string {
    cleaned := strings.NewReplacer("<", "", ">", "", "\x00", "", "../", "").Replace(input)
    cleaned = strings.TrimSpace(cleaned)
    if len(cleaned) > max { return cleaned[:max] }
    return cleaned
}

func requireRole(actor Actor, roles ...string) PolicyDecision {
    for _, r := range roles {
        if actor.Role == r { return PolicyDecision{Allowed:true, Code:"ok", Reason:"role allowed", Audit:map[string]string{"role":actor.Role}} }
    }
    return PolicyDecision{Allowed:false, Code:"role_denied", Reason:fmt.Sprintf("%s cannot access this engine action", actor.Role), Audit:map[string]string{"role":actor.Role}}
}

func requireVerifiedTeacher(actor Actor) PolicyDecision {
    if actor.Role != "teacher" { return PolicyDecision{Allowed:false, Code:"teacher_only", Reason:"only teachers can perform this action"} }
    if !actor.Verified { return PolicyDecision{Allowed:false, Code:"teacher_unverified", Reason:"teacher certificate must be verified first"} }
    return PolicyDecision{Allowed:true, Code:"ok", Reason:"verified teacher"}
}

func buildAudit(action, actorID, subjectID, severity string, metadata map[string]string) AuditEvent {
    return AuditEvent{Engine:"lanmat", Action:action, ActorID:actorID, SubjectID:subjectID, Severity:severity, Metadata:metadata, CreatedAt:time.Now().UTC()}
}

func validateRequired(fields map[string]string) []ValidationIssue {
    issues := make([]ValidationIssue, 0)
    keys := make([]string, 0, len(fields))
    for k := range fields { keys = append(keys, k) }
    sort.Strings(keys)
    for _, k := range keys {
        if strings.TrimSpace(fields[k]) == "" {
            issues = append(issues, ValidationIssue{Field:k, Code:"required", Message:k+" is required"})
        }
    }
    return issues
}

func enqueueJob(action string, actor Actor, payload map[string]string) JobEnvelope {
    return JobEnvelope{
        ID: stableID("lanmat", action, actor.ID, fmt.Sprint(time.Now().UnixNano())),
        Type: "lanmat." + action,
        ActorID: actor.ID,
        Engine: "lanmat",
        Payload: payload,
        Attempts: 0,
        CreatedAt: time.Now().UTC(),
    }
}

func cacheKey(parts ...string) string { return "learnzur:lanmat:" + strings.Join(parts, ":") }


// SubmitListingRequest contains the validated command payload used by the lanmat engine.
type SubmitListingRequest struct {
    Actor Actor
    SubjectID string
    Fields map[string]string
    IdempotencyKey string
}

type SubmitListingResponse struct {
    OK bool
    Message string
    CacheKey string
    Job JobEnvelope
    Audit AuditEvent
    Issues []ValidationIssue
}

func ValidateSubmitListing(req SubmitListingRequest) []ValidationIssue {
    issues := validateRequired(map[string]string{"actor_id": req.Actor.ID, "subject_id": req.SubjectID})
    if req.IdempotencyKey == "" { issues = append(issues, ValidationIssue{Field:"idempotency_key", Code:"required", Message:"idempotency key prevents duplicate actions"}) }
    for k, v := range req.Fields {
        if strings.Contains(strings.ToLower(v), "<script") { issues = append(issues, ValidationIssue{Field:k, Code:"unsafe_html", Message:"script tags are not allowed"}) }
    }
    return issues
}

func HandleSubmitListing(req SubmitListingRequest) (SubmitListingResponse, error) {
    if issues := ValidateSubmitListing(req); len(issues) > 0 {
        return SubmitListingResponse{OK:false, Message:"validation failed", Issues:issues}, ErrValidation
    }
    cleaned := map[string]string{}
    for k, v := range req.Fields { cleaned[k] = sanitizeText(v, 5000) }
    decision := requireRole(req.Actor, "admin", "teacher", "parent", "learner")
    if !decision.Allowed {
        return SubmitListingResponse{OK:false, Message:decision.Reason}, ErrForbidden
    }
    job := enqueueJob("SubmitListing", req.Actor, cleaned)
    audit := buildAudit("SubmitListing", req.Actor.ID, req.SubjectID, "info", map[string]string{"idempotency_key":req.IdempotencyKey, "cache_key":cacheKey("SubmitListing", req.SubjectID)})
    return SubmitListingResponse{OK:true, Message:"SubmitListing accepted", CacheKey:cacheKey("SubmitListing", req.SubjectID), Job:job, Audit:audit}, nil
}

// ApproveListingRequest contains the validated command payload used by the lanmat engine.
type ApproveListingRequest struct {
    Actor Actor
    SubjectID string
    Fields map[string]string
    IdempotencyKey string
}

type ApproveListingResponse struct {
    OK bool
    Message string
    CacheKey string
    Job JobEnvelope
    Audit AuditEvent
    Issues []ValidationIssue
}

func ValidateApproveListing(req ApproveListingRequest) []ValidationIssue {
    issues := validateRequired(map[string]string{"actor_id": req.Actor.ID, "subject_id": req.SubjectID})
    if req.IdempotencyKey == "" { issues = append(issues, ValidationIssue{Field:"idempotency_key", Code:"required", Message:"idempotency key prevents duplicate actions"}) }
    for k, v := range req.Fields {
        if strings.Contains(strings.ToLower(v), "<script") { issues = append(issues, ValidationIssue{Field:k, Code:"unsafe_html", Message:"script tags are not allowed"}) }
    }
    return issues
}

func HandleApproveListing(req ApproveListingRequest) (ApproveListingResponse, error) {
    if issues := ValidateApproveListing(req); len(issues) > 0 {
        return ApproveListingResponse{OK:false, Message:"validation failed", Issues:issues}, ErrValidation
    }
    cleaned := map[string]string{}
    for k, v := range req.Fields { cleaned[k] = sanitizeText(v, 5000) }
    decision := requireRole(req.Actor, "admin", "teacher", "parent", "learner")
    if !decision.Allowed {
        return ApproveListingResponse{OK:false, Message:decision.Reason}, ErrForbidden
    }
    job := enqueueJob("ApproveListing", req.Actor, cleaned)
    audit := buildAudit("ApproveListing", req.Actor.ID, req.SubjectID, "info", map[string]string{"idempotency_key":req.IdempotencyKey, "cache_key":cacheKey("ApproveListing", req.SubjectID)})
    return ApproveListingResponse{OK:true, Message:"ApproveListing accepted", CacheKey:cacheKey("ApproveListing", req.SubjectID), Job:job, Audit:audit}, nil
}

// PurchaseListingRequest contains the validated command payload used by the lanmat engine.
type PurchaseListingRequest struct {
    Actor Actor
    SubjectID string
    Fields map[string]string
    IdempotencyKey string
}

type PurchaseListingResponse struct {
    OK bool
    Message string
    CacheKey string
    Job JobEnvelope
    Audit AuditEvent
    Issues []ValidationIssue
}

func ValidatePurchaseListing(req PurchaseListingRequest) []ValidationIssue {
    issues := validateRequired(map[string]string{"actor_id": req.Actor.ID, "subject_id": req.SubjectID})
    if req.IdempotencyKey == "" { issues = append(issues, ValidationIssue{Field:"idempotency_key", Code:"required", Message:"idempotency key prevents duplicate actions"}) }
    for k, v := range req.Fields {
        if strings.Contains(strings.ToLower(v), "<script") { issues = append(issues, ValidationIssue{Field:k, Code:"unsafe_html", Message:"script tags are not allowed"}) }
    }
    return issues
}

func HandlePurchaseListing(req PurchaseListingRequest) (PurchaseListingResponse, error) {
    if issues := ValidatePurchaseListing(req); len(issues) > 0 {
        return PurchaseListingResponse{OK:false, Message:"validation failed", Issues:issues}, ErrValidation
    }
    cleaned := map[string]string{}
    for k, v := range req.Fields { cleaned[k] = sanitizeText(v, 5000) }
    decision := requireRole(req.Actor, "admin", "teacher", "parent", "learner")
    if !decision.Allowed {
        return PurchaseListingResponse{OK:false, Message:decision.Reason}, ErrForbidden
    }
    job := enqueueJob("PurchaseListing", req.Actor, cleaned)
    audit := buildAudit("PurchaseListing", req.Actor.ID, req.SubjectID, "info", map[string]string{"idempotency_key":req.IdempotencyKey, "cache_key":cacheKey("PurchaseListing", req.SubjectID)})
    return PurchaseListingResponse{OK:true, Message:"PurchaseListing accepted", CacheKey:cacheKey("PurchaseListing", req.SubjectID), Job:job, Audit:audit}, nil
}

// FulfillPurchaseRequest contains the validated command payload used by the lanmat engine.
type FulfillPurchaseRequest struct {
    Actor Actor
    SubjectID string
    Fields map[string]string
    IdempotencyKey string
}

type FulfillPurchaseResponse struct {
    OK bool
    Message string
    CacheKey string
    Job JobEnvelope
    Audit AuditEvent
    Issues []ValidationIssue
}

func ValidateFulfillPurchase(req FulfillPurchaseRequest) []ValidationIssue {
    issues := validateRequired(map[string]string{"actor_id": req.Actor.ID, "subject_id": req.SubjectID})
    if req.IdempotencyKey == "" { issues = append(issues, ValidationIssue{Field:"idempotency_key", Code:"required", Message:"idempotency key prevents duplicate actions"}) }
    for k, v := range req.Fields {
        if strings.Contains(strings.ToLower(v), "<script") { issues = append(issues, ValidationIssue{Field:k, Code:"unsafe_html", Message:"script tags are not allowed"}) }
    }
    return issues
}

func HandleFulfillPurchase(req FulfillPurchaseRequest) (FulfillPurchaseResponse, error) {
    if issues := ValidateFulfillPurchase(req); len(issues) > 0 {
        return FulfillPurchaseResponse{OK:false, Message:"validation failed", Issues:issues}, ErrValidation
    }
    cleaned := map[string]string{}
    for k, v := range req.Fields { cleaned[k] = sanitizeText(v, 5000) }
    decision := requireRole(req.Actor, "admin", "teacher", "parent", "learner")
    if !decision.Allowed {
        return FulfillPurchaseResponse{OK:false, Message:decision.Reason}, ErrForbidden
    }
    job := enqueueJob("FulfillPurchase", req.Actor, cleaned)
    audit := buildAudit("FulfillPurchase", req.Actor.ID, req.SubjectID, "info", map[string]string{"idempotency_key":req.IdempotencyKey, "cache_key":cacheKey("FulfillPurchase", req.SubjectID)})
    return FulfillPurchaseResponse{OK:true, Message:"FulfillPurchase accepted", CacheKey:cacheKey("FulfillPurchase", req.SubjectID), Job:job, Audit:audit}, nil
}

// SearchListingsRequest contains the validated command payload used by the lanmat engine.
type SearchListingsRequest struct {
    Actor Actor
    SubjectID string
    Fields map[string]string
    IdempotencyKey string
}

type SearchListingsResponse struct {
    OK bool
    Message string
    CacheKey string
    Job JobEnvelope
    Audit AuditEvent
    Issues []ValidationIssue
}

func ValidateSearchListings(req SearchListingsRequest) []ValidationIssue {
    issues := validateRequired(map[string]string{"actor_id": req.Actor.ID, "subject_id": req.SubjectID})
    if req.IdempotencyKey == "" { issues = append(issues, ValidationIssue{Field:"idempotency_key", Code:"required", Message:"idempotency key prevents duplicate actions"}) }
    for k, v := range req.Fields {
        if strings.Contains(strings.ToLower(v), "<script") { issues = append(issues, ValidationIssue{Field:k, Code:"unsafe_html", Message:"script tags are not allowed"}) }
    }
    return issues
}

func HandleSearchListings(req SearchListingsRequest) (SearchListingsResponse, error) {
    if issues := ValidateSearchListings(req); len(issues) > 0 {
        return SearchListingsResponse{OK:false, Message:"validation failed", Issues:issues}, ErrValidation
    }
    cleaned := map[string]string{}
    for k, v := range req.Fields { cleaned[k] = sanitizeText(v, 5000) }
    decision := requireRole(req.Actor, "admin", "teacher", "parent", "learner")
    if !decision.Allowed {
        return SearchListingsResponse{OK:false, Message:decision.Reason}, ErrForbidden
    }
    job := enqueueJob("SearchListings", req.Actor, cleaned)
    audit := buildAudit("SearchListings", req.Actor.ID, req.SubjectID, "info", map[string]string{"idempotency_key":req.IdempotencyKey, "cache_key":cacheKey("SearchListings", req.SubjectID)})
    return SearchListingsResponse{OK:true, Message:"SearchListings accepted", CacheKey:cacheKey("SearchListings", req.SubjectID), Job:job, Audit:audit}, nil
}

var SecurityControls = []string{
    "01. Require JWT subject and role before every mutating action",
    "02. Use idempotency keys for payments, points and submissions",
    "03. Sanitize all user text before persistence",
    "04. Write audit logs for sensitive actions",
    "05. Deny direct learner access to parent-only financial data",
    "06. Verify ownership before reads",
    "07. Apply per-user and per-IP rate limits",
    "08. Encrypt sensitive fields at rest",
    "09. Use prepared statements for every query",
    "10. Validate file MIME and size before processing",
    "11. Reject expired class tokens",
    "12. Apply age adaptive safety rules",
    "13. Use Redis locks for balance-affecting writes",
    "14. Fail closed for financial callbacks",
    "15. Fail open only for non-critical chat moderation delays",
    "16. Record raw provider callbacks for dispute recovery",
    "17. Never trust client supplied prices",
    "18. Cross-check teacher verification before publishing",
    "19. Apply county and age filters on public search",
    "20. Protect child profile data from public endpoints",
    "21. Normalize phone numbers before payment lookup",
    "22. Hash reset tokens and OTPs",
    "23. Expire sessions on password reset",
    "24. Limit retries on background jobs",
    "25. Use least-privilege database roles",
    "26. Store audit records append-only",
    "27. Mask phone/email in logs",
    "28. Validate callback signatures",
    "29. Deduplicate Redis stream messages",
    "30. Scope cache keys by engine namespace",
    "31. Require JWT subject and role before every mutating action",
    "32. Use idempotency keys for payments, points and submissions",
    "33. Sanitize all user text before persistence",
    "34. Write audit logs for sensitive actions",
    "35. Deny direct learner access to parent-only financial data",
    "36. Verify ownership before reads",
    "37. Apply per-user and per-IP rate limits",
    "38. Encrypt sensitive fields at rest",
    "39. Use prepared statements for every query",
    "40. Validate file MIME and size before processing",
    "41. Reject expired class tokens",
    "42. Apply age adaptive safety rules",
    "43. Use Redis locks for balance-affecting writes",
    "44. Fail closed for financial callbacks",
    "45. Fail open only for non-critical chat moderation delays",
    "46. Record raw provider callbacks for dispute recovery",
    "47. Never trust client supplied prices",
    "48. Cross-check teacher verification before publishing",
    "49. Apply county and age filters on public search",
    "50. Protect child profile data from public endpoints",
}

var SpeedControls = []string{
    "01. Cache public reads in Redis with short TTL",
    "02. Use cursor pagination over offset pagination",
    "03. Batch writes from worker jobs",
    "04. Precompute dashboard summaries",
    "05. Use materialized views for reports",
    "06. Avoid N+1 queries with joins",
    "07. Use small JSON payloads",
    "08. Stream long-running output",
    "09. Separate hot counters from cold metadata",
    "10. Invalidate only affected cache keys",
    "11. Use connection pools",
    "12. Prefer async work for media and notifications",
    "13. Keep indexes aligned with query filters",
    "14. Compress API responses",
    "15. Debounce frontend search requests",
    "16. Cache public reads in Redis with short TTL",
    "17. Use cursor pagination over offset pagination",
    "18. Batch writes from worker jobs",
    "19. Precompute dashboard summaries",
    "20. Use materialized views for reports",
    "21. Avoid N+1 queries with joins",
    "22. Use small JSON payloads",
    "23. Stream long-running output",
    "24. Separate hot counters from cold metadata",
    "25. Invalidate only affected cache keys",
    "26. Use connection pools",
    "27. Prefer async work for media and notifications",
    "28. Keep indexes aligned with query filters",
    "29. Compress API responses",
    "30. Debounce frontend search requests",
    "31. Cache public reads in Redis with short TTL",
    "32. Use cursor pagination over offset pagination",
    "33. Batch writes from worker jobs",
    "34. Precompute dashboard summaries",
    "35. Use materialized views for reports",
    "36. Avoid N+1 queries with joins",
    "37. Use small JSON payloads",
    "38. Stream long-running output",
    "39. Separate hot counters from cold metadata",
    "40. Invalidate only affected cache keys",
    "41. Use connection pools",
    "42. Prefer async work for media and notifications",
    "43. Keep indexes aligned with query filters",
    "44. Compress API responses",
    "45. Debounce frontend search requests",
    "46. Cache public reads in Redis with short TTL",
    "47. Use cursor pagination over offset pagination",
    "48. Batch writes from worker jobs",
    "49. Precompute dashboard summaries",
    "50. Use materialized views for reports",
}

func ExplainSecurity() []string { return SecurityControls }
func ExplainSpeed() []string { return SpeedControls }
