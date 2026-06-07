package gamfy

import (
	"errors"
	"regexp"
	"strings"
	"time"

	shared "learnzur/backend/internal/security"
)

const EngineName = "gamfy"
const ProtectedSurface = "rewards, points, badges, streaks, leaderboard"
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
	return EngineName + " = rewards, points, badges, streaks, leaderboard"
}

func SecurityRules() []string {
	return []string{
		"1. Verify user is authenticated before awarding points",
		"2. Confirm learner owns the gamfy profile",
		"3. Prevent duplicate point awards for the same action",
		"4. Use idempotency keys for point transactions",
		"5. Validate action type before awarding points",
		"6. Reject unknown gamification actions",
		"7. Prevent client from sending raw point values",
		"8. Points must come from server-side rules only",
		"9. Validate badge criteria before unlock",
		"10. Prevent duplicate badge unlocks",
		"11. Lock streak update per learner per day",
		"12. Prevent manual streak manipulation",
		"13. Validate timezone for daily streaks",
		"14. Prevent future-date streak activity",
		"15. Prevent backdated streak abuse",
		"16. Log every point award",
		"17. Log every badge unlock",
		"18. Log every streak reset",
		"19. Audit admin changes to gamfy rules",
		"20. Rate-limit reward claims",
		"21. Prevent leaderboard score tampering",
		"22. Recalculate leaderboard from trusted point records",
		"23. Prevent negative point injection",
		"24. Prevent overflow point values",
		"25. Validate learner age group before age-adaptive reward",
		"26. Protect junior learners from public ranking exposure",
		"27. Hide sensitive learner identity on leaderboards",
		"28. Restrict admin-only gamfy config endpoints",
		"29. Require role check for admin rule changes",
		"30. Use DB transactions for points and badge updates",
		"31. Roll back reward if related learning action fails",
		"32. Prevent repeated reward from replayed RPC calls",
		"33. Sign internal RPC requests",
		"34. Validate RPC caller engine",
		"35. Reject expired internal RPC tokens",
		"36. Cache only non-sensitive leaderboard data",
		"37. Invalidate leaderboard cache after point changes",
		"38. Detect suspicious point farming",
		"39. Flag abnormal reward activity",
		"40. Write immutable audit logs for all reward changes",
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
