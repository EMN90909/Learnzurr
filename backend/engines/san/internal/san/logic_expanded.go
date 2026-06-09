
package san

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
    return AuditEvent{Engine:"san", Action:action, ActorID:actorID, SubjectID:subjectID, Severity:severity, Metadata:metadata, CreatedAt:time.Now().UTC()}
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
        ID: stableID("san", action, actor.ID, fmt.Sprint(time.Now().UnixNano())),
        Type: "san." + action,
        ActorID: actor.ID,
        Engine: "san",
        Payload: payload,
        Attempts: 0,
        CreatedAt: time.Now().UTC(),
    }
}

func cacheKey(parts ...string) string { return "learnzur:san:" + strings.Join(parts, ":") }


// ExecuteCodeRequest contains the validated command payload used by the san engine.
type ExecuteCodeRequest struct {
    Actor Actor
    SubjectID string
    Fields map[string]string
    IdempotencyKey string
}

type ExecuteCodeResponse struct {
    OK bool
    Message string
    CacheKey string
    Job JobEnvelope
    Audit AuditEvent
    Issues []ValidationIssue
}

func ValidateExecuteCode(req ExecuteCodeRequest) []ValidationIssue {
    issues := validateRequired(map[string]string{"actor_id": req.Actor.ID, "subject_id": req.SubjectID})
    if req.IdempotencyKey == "" { issues = append(issues, ValidationIssue{Field:"idempotency_key", Code:"required", Message:"idempotency key prevents duplicate actions"}) }
    for k, v := range req.Fields {
        if strings.Contains(strings.ToLower(v), "<script") { issues = append(issues, ValidationIssue{Field:k, Code:"unsafe_html", Message:"script tags are not allowed"}) }
    }
    return issues
}

func HandleExecuteCode(req ExecuteCodeRequest) (ExecuteCodeResponse, error) {
    if issues := ValidateExecuteCode(req); len(issues) > 0 {
        return ExecuteCodeResponse{OK:false, Message:"validation failed", Issues:issues}, ErrValidation
    }
    cleaned := map[string]string{}
    for k, v := range req.Fields { cleaned[k] = sanitizeText(v, 5000) }
    decision := requireRole(req.Actor, "admin", "teacher", "parent", "learner")
    if !decision.Allowed {
        return ExecuteCodeResponse{OK:false, Message:decision.Reason}, ErrForbidden
    }
    job := enqueueJob("ExecuteCode", req.Actor, cleaned)
    audit := buildAudit("ExecuteCode", req.Actor.ID, req.SubjectID, "info", map[string]string{"idempotency_key":req.IdempotencyKey, "cache_key":cacheKey("ExecuteCode", req.SubjectID)})
    return ExecuteCodeResponse{OK:true, Message:"ExecuteCode accepted", CacheKey:cacheKey("ExecuteCode", req.SubjectID), Job:job, Audit:audit}, nil
}

// SaveProjectRequest contains the validated command payload used by the san engine.
type SaveProjectRequest struct {
    Actor Actor
    SubjectID string
    Fields map[string]string
    IdempotencyKey string
}

type SaveProjectResponse struct {
    OK bool
    Message string
    CacheKey string
    Job JobEnvelope
    Audit AuditEvent
    Issues []ValidationIssue
}

func ValidateSaveProject(req SaveProjectRequest) []ValidationIssue {
    issues := validateRequired(map[string]string{"actor_id": req.Actor.ID, "subject_id": req.SubjectID})
    if req.IdempotencyKey == "" { issues = append(issues, ValidationIssue{Field:"idempotency_key", Code:"required", Message:"idempotency key prevents duplicate actions"}) }
    for k, v := range req.Fields {
        if strings.Contains(strings.ToLower(v), "<script") { issues = append(issues, ValidationIssue{Field:k, Code:"unsafe_html", Message:"script tags are not allowed"}) }
    }
    return issues
}

func HandleSaveProject(req SaveProjectRequest) (SaveProjectResponse, error) {
    if issues := ValidateSaveProject(req); len(issues) > 0 {
        return SaveProjectResponse{OK:false, Message:"validation failed", Issues:issues}, ErrValidation
    }
    cleaned := map[string]string{}
    for k, v := range req.Fields { cleaned[k] = sanitizeText(v, 5000) }
    decision := requireRole(req.Actor, "admin", "teacher", "parent", "learner")
    if !decision.Allowed {
        return SaveProjectResponse{OK:false, Message:decision.Reason}, ErrForbidden
    }
    job := enqueueJob("SaveProject", req.Actor, cleaned)
    audit := buildAudit("SaveProject", req.Actor.ID, req.SubjectID, "info", map[string]string{"idempotency_key":req.IdempotencyKey, "cache_key":cacheKey("SaveProject", req.SubjectID)})
    return SaveProjectResponse{OK:true, Message:"SaveProject accepted", CacheKey:cacheKey("SaveProject", req.SubjectID), Job:job, Audit:audit}, nil
}

// GetProjectRequest contains the validated command payload used by the san engine.
type GetProjectRequest struct {
    Actor Actor
    SubjectID string
    Fields map[string]string
    IdempotencyKey string
}

type GetProjectResponse struct {
    OK bool
    Message string
    CacheKey string
    Job JobEnvelope
    Audit AuditEvent
    Issues []ValidationIssue
}

func ValidateGetProject(req GetProjectRequest) []ValidationIssue {
    issues := validateRequired(map[string]string{"actor_id": req.Actor.ID, "subject_id": req.SubjectID})
    if req.IdempotencyKey == "" { issues = append(issues, ValidationIssue{Field:"idempotency_key", Code:"required", Message:"idempotency key prevents duplicate actions"}) }
    for k, v := range req.Fields {
        if strings.Contains(strings.ToLower(v), "<script") { issues = append(issues, ValidationIssue{Field:k, Code:"unsafe_html", Message:"script tags are not allowed"}) }
    }
    return issues
}

func HandleGetProject(req GetProjectRequest) (GetProjectResponse, error) {
    if issues := ValidateGetProject(req); len(issues) > 0 {
        return GetProjectResponse{OK:false, Message:"validation failed", Issues:issues}, ErrValidation
    }
    cleaned := map[string]string{}
    for k, v := range req.Fields { cleaned[k] = sanitizeText(v, 5000) }
    decision := requireRole(req.Actor, "admin", "teacher", "parent", "learner")
    if !decision.Allowed {
        return GetProjectResponse{OK:false, Message:decision.Reason}, ErrForbidden
    }
    job := enqueueJob("GetProject", req.Actor, cleaned)
    audit := buildAudit("GetProject", req.Actor.ID, req.SubjectID, "info", map[string]string{"idempotency_key":req.IdempotencyKey, "cache_key":cacheKey("GetProject", req.SubjectID)})
    return GetProjectResponse{OK:true, Message:"GetProject accepted", CacheKey:cacheKey("GetProject", req.SubjectID), Job:job, Audit:audit}, nil
}

// ListProjectsRequest contains the validated command payload used by the san engine.
type ListProjectsRequest struct {
    Actor Actor
    SubjectID string
    Fields map[string]string
    IdempotencyKey string
}

type ListProjectsResponse struct {
    OK bool
    Message string
    CacheKey string
    Job JobEnvelope
    Audit AuditEvent
    Issues []ValidationIssue
}

func ValidateListProjects(req ListProjectsRequest) []ValidationIssue {
    issues := validateRequired(map[string]string{"actor_id": req.Actor.ID, "subject_id": req.SubjectID})
    if req.IdempotencyKey == "" { issues = append(issues, ValidationIssue{Field:"idempotency_key", Code:"required", Message:"idempotency key prevents duplicate actions"}) }
    for k, v := range req.Fields {
        if strings.Contains(strings.ToLower(v), "<script") { issues = append(issues, ValidationIssue{Field:k, Code:"unsafe_html", Message:"script tags are not allowed"}) }
    }
    return issues
}

func HandleListProjects(req ListProjectsRequest) (ListProjectsResponse, error) {
    if issues := ValidateListProjects(req); len(issues) > 0 {
        return ListProjectsResponse{OK:false, Message:"validation failed", Issues:issues}, ErrValidation
    }
    cleaned := map[string]string{}
    for k, v := range req.Fields { cleaned[k] = sanitizeText(v, 5000) }
    decision := requireRole(req.Actor, "admin", "teacher", "parent", "learner")
    if !decision.Allowed {
        return ListProjectsResponse{OK:false, Message:decision.Reason}, ErrForbidden
    }
    job := enqueueJob("ListProjects", req.Actor, cleaned)
    audit := buildAudit("ListProjects", req.Actor.ID, req.SubjectID, "info", map[string]string{"idempotency_key":req.IdempotencyKey, "cache_key":cacheKey("ListProjects", req.SubjectID)})
    return ListProjectsResponse{OK:true, Message:"ListProjects accepted", CacheKey:cacheKey("ListProjects", req.SubjectID), Job:job, Audit:audit}, nil
}

// DeleteProjectRequest contains the validated command payload used by the san engine.
type DeleteProjectRequest struct {
    Actor Actor
    SubjectID string
    Fields map[string]string
    IdempotencyKey string
}

type DeleteProjectResponse struct {
    OK bool
    Message string
    CacheKey string
    Job JobEnvelope
    Audit AuditEvent
    Issues []ValidationIssue
}

func ValidateDeleteProject(req DeleteProjectRequest) []ValidationIssue {
    issues := validateRequired(map[string]string{"actor_id": req.Actor.ID, "subject_id": req.SubjectID})
    if req.IdempotencyKey == "" { issues = append(issues, ValidationIssue{Field:"idempotency_key", Code:"required", Message:"idempotency key prevents duplicate actions"}) }
    for k, v := range req.Fields {
        if strings.Contains(strings.ToLower(v), "<script") { issues = append(issues, ValidationIssue{Field:k, Code:"unsafe_html", Message:"script tags are not allowed"}) }
    }
    return issues
}

func HandleDeleteProject(req DeleteProjectRequest) (DeleteProjectResponse, error) {
    if issues := ValidateDeleteProject(req); len(issues) > 0 {
        return DeleteProjectResponse{OK:false, Message:"validation failed", Issues:issues}, ErrValidation
    }
    cleaned := map[string]string{}
    for k, v := range req.Fields { cleaned[k] = sanitizeText(v, 5000) }
    decision := requireRole(req.Actor, "admin", "teacher", "parent", "learner")
    if !decision.Allowed {
        return DeleteProjectResponse{OK:false, Message:decision.Reason}, ErrForbidden
    }
    job := enqueueJob("DeleteProject", req.Actor, cleaned)
    audit := buildAudit("DeleteProject", req.Actor.ID, req.SubjectID, "info", map[string]string{"idempotency_key":req.IdempotencyKey, "cache_key":cacheKey("DeleteProject", req.SubjectID)})
    return DeleteProjectResponse{OK:true, Message:"DeleteProject accepted", CacheKey:cacheKey("DeleteProject", req.SubjectID), Job:job, Audit:audit}, nil
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
