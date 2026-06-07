package find

import (
	"errors"
	"regexp"
	"strings"
	"time"

	shared "learnzur/backend/internal/security"
)

const EngineName = "find"
const ProtectedSurface = "search, suggestions, SEO class pages"
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
	return EngineName + " = search, suggestions, SEO class pages"
}

func SecurityRules() []string {
	return []string{
		"1. Sanitize search query",
		"2. Trim query length",
		"3. Reject dangerous characters where needed",
		"4. Prevent SQL injection",
		"5. Use parameterized search queries",
		"6. Rate-limit search requests",
		"7. Rate-limit suggestions",
		"8. Prevent scraping through pagination abuse",
		"9. Limit page size",
		"10. Use cursor pagination",
		"11. Hide private classes from public search",
		"12. Hide suspended classes",
		"13. Hide banned teachers",
		"14. Hide under-review content",
		"15. Respect class visibility rules",
		"16. Do not expose learner data in search",
		"17. Do not expose parent data in search",
		"18. Do not expose private teacher contact details",
		"19. Sanitize search result snippets",
		"20. Sanitize SSR metadata",
		"21. Prevent XSS in SEO descriptions",
		"22. Validate class ID before SSR rendering",
		"23. Prevent SSR access to private class pages",
		"24. Cache only public-safe search results",
		"25. Invalidate search cache after class status change",
		"26. Validate filters against allowed list",
		"27. Reject unknown sort fields",
		"28. Prevent ranking manipulation from frontend",
		"29. Log zero-result queries safely",
		"30. Avoid storing sensitive search queries where possible",
		"31. Mask user identity in analytics",
		"32. Restrict admin analytics by role",
		"33. Sign internal RPC request to Media",
		"34. Validate media asset response before using",
		"35. Prevent open redirect in search links",
		"36. Prevent malicious URL injection",
		"37. Audit admin search config changes",
		"38. Detect bot-like query patterns",
		"39. Temporarily block abusive IP/user",
		"40. Protect search indexes from unauthorized writes",
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
