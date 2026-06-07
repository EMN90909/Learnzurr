package flag

import (
	"errors"
	"regexp"
	"strings"
	"time"

	shared "learnzur/backend/internal/security"
)

const EngineName = "flag"
const ProtectedSurface = "moderation, AI scanning, rule scanning, strikes, appeals"
const maxEnginePayloadFields = 7
const maxEngineTextLength = 100

var safeIdentifierPattern = regexp.MustCompile(`^[A-Za-z0-9_-]+$`)

type SecurityDecision struct {
	Allowed bool   `json:"allowed"`
	Reason  string `json:"reason"`
}

type SecurityContext struct {
	ActorID        string
	ActorRole      string
	ResourceOwner  string
	Action         string
	IdempotencyKey string
	RPCCaller      string
	RPCTokenExpiry time.Time
	Payload        map[string]any
}

func EngineMeaning() string {
	return EngineName + " = moderation, AI scanning, rule scanning, strikes, appeals"
}

func SecurityRules() []string {
	return []string{
		"1. Verify internal caller before scan request",
		"2. Sign all scan RPC requests",
		"3. Validate calling engine name",
		"4. Validate content type before scanning",
		"5. Sanitize content before rule scanning",
		"6. Limit content size for scanning",
		"7. Rate-limit scan requests",
		"8. Prevent scan queue flooding",
		"9. Use safe timeout for AI provider calls",
		"10. Fail safely based on content type",
		"11. For critical content, block if scan fails",
		"12. For low-risk chat, allow or queue based on policy",
		"13. Never expose AI provider keys",
		"14. Never log full sensitive child messages unnecessarily",
		"15. Mask personal data in moderation logs where possible",
		"16. Store full evidence only when policy requires",
		"17. Protect moderation records from normal users",
		"18. Allow user to view only their own appeal status",
		"19. Restrict flag review to admin/moderator roles",
		"20. Audit every moderator action",
		"21. Audit every strike",
		"22. Audit every appeal decision",
		"23. Prevent duplicate strikes for same content",
		"24. Use idempotency key for scan result",
		"25. Validate severity values",
		"26. Validate moderation category",
		"27. Prevent user from removing own strike",
		"28. Enforce strike expiry rules",
		"29. Enforce restriction expiry rules",
		"30. Prevent banned user from posting",
		"31. Keep keyword blacklist admin-only",
		"32. Validate blacklist pattern safety",
		"33. Prevent dangerous regex patterns",
		"34. Cache blacklist safely",
		"35. Refresh blacklist after admin update",
		"36. Detect repeated unsafe behavior",
		"37. Escalate severe child-safety flags",
		"38. Notify user/parent/admin based on severity",
		"39. Sign internal Notify RPC calls",
		"40. Store immutable flag audit trail",
	}
}

func ValidateRequest(actorID string, payload map[string]any) SecurityDecision {
	ctx := SecurityContext{ActorID: actorID, Payload: payload}
	return ValidateSecurityContext(ctx)
}

func ValidateSecurityContext(ctx SecurityContext) SecurityDecision {
	if strings.TrimSpace(ctx.ActorID) == "" {
		return SecurityDecision{Allowed: false, Reason: "actor is required"}
	}
	if shared.IsRestrictedUser(ctx.ActorID) {
		return SecurityDecision{Allowed: false, Reason: "actor is restricted"}
	}
	if ctx.Payload == nil {
		return SecurityDecision{Allowed: false, Reason: "payload is required"}
	}
	if len(ctx.Payload) > maxEnginePayloadFields {
		return SecurityDecision{Allowed: false, Reason: "payload has too many fields"}
	}
	for key, value := range ctx.Payload {
		if !safeIdentifierPattern.MatchString(key) {
			return SecurityDecision{Allowed: false, Reason: "payload key is unsafe"}
		}
		if text, ok := value.(string); ok {
			if len(text) > maxEngineTextLength {
				return SecurityDecision{Allowed: false, Reason: "text is too long"}
			}
			if containsUnsafeMarkup(text) {
				return SecurityDecision{Allowed: false, Reason: "html is not allowed"}
			}
		}
	}
	return SecurityDecision{Allowed: true, Reason: "accepted"}
}

func containsUnsafeMarkup(text string) bool {
	lower := strings.ToLower(text)
	return strings.Contains(lower, "<script") || strings.Contains(lower, "</script") || strings.Contains(text, "<") || strings.Contains(text, ">")
}

func RequireAllowed(decision SecurityDecision) error {
	if !decision.Allowed {
		return errors.New(decision.Reason)
	}
	return nil
}

func RequireInternalRPC(caller string, expiresAt time.Time, allowedCallers ...string) SecurityDecision {
	if strings.TrimSpace(caller) == "" {
		return SecurityDecision{Allowed: false, Reason: "rpc caller is required"}
	}
	if time.Now().After(expiresAt) {
		return SecurityDecision{Allowed: false, Reason: "rpc token expired"}
	}
	for _, allowed := range allowedCallers {
		if caller == allowed {
			return SecurityDecision{Allowed: true, Reason: "rpc accepted"}
		}
	}
	return SecurityDecision{Allowed: false, Reason: "rpc caller is not allowed"}
}
