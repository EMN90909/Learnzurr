package san

import (
	"errors"
	"regexp"
	"strings"
	"time"

	shared "learnzur/backend/internal/security"
)

const EngineName = "san"
const ProtectedSurface = "coding sandbox and learner projects"
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
	return EngineName + " = coding sandbox and learner projects"
}

func SecurityRules() []string {
	return []string{
		"1. Verify user authentication",
		"2. Check learner owns project before edit",
		"3. Validate project language",
		"4. Allow only supported runners",
		"5. Reject unknown runtime images",
		"6. Run code in isolated container",
		"7. Disable container network",
		"8. Block host filesystem mounts",
		"9. Use read-only base filesystem where possible",
		"10. Set CPU limit",
		"11. Set memory limit",
		"12. Set process limit",
		"13. Set execution timeout",
		"14. Hard-kill long-running containers",
		"15. Remove container after execution",
		"16. Prevent shell escape commands",
		"17. Sanitize dangerous imports/modules",
		"18. Block filesystem traversal",
		"19. Block access to environment secrets",
		"20. Strip secrets from execution output",
		"21. Limit stdout size",
		"22. Limit stderr size",
		"23. Rate-limit code executions",
		"24. Prevent fork bombs",
		"25. Prevent infinite output loops",
		"26. Prevent container privilege escalation",
		"27. Run as non-root user",
		"28. Use seccomp/AppArmor where available",
		"29. Disable Docker socket access",
		"30. Validate project title/content length",
		"31. Sanitize project descriptions",
		"32. Scan public shared projects with Flag",
		"33. Prevent learners from editing others\u2019 projects",
		"34. Protect private projects from public access",
		"35. Use signed share links",
		"36. Expire temporary run sessions",
		"37. Audit every execution",
		"38. Audit resource violations",
		"39. Cache runner config safely",
		"40. Alert admin on repeated sandbox violations",
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
