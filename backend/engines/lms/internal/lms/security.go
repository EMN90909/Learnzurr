package lms

import (
	"errors"
	"regexp"
	"strings"
	"time"

	shared "learnzur/backend/internal/security"
)

const EngineName = "lms"
const ProtectedSurface = "quizzes, tests, assignments, submissions, grades"
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
	return EngineName + " = quizzes, tests, assignments, submissions, grades"
}

func SecurityRules() []string {
	return []string{
		"1. Verify user authentication",
		"2. Check learner enrollment before access",
		"3. Check teacher owns class before editing LMS content",
		"4. Prevent parent from submitting learner work",
		"5. Prevent learner from creating quizzes/tests",
		"6. Enforce quiz availability window",
		"7. Enforce test availability window",
		"8. Enforce assignment deadline",
		"9. Prevent duplicate quiz submission",
		"10. Prevent duplicate test submission",
		"11. Prevent duplicate assignment submission unless allowed",
		"12. Use server time for deadlines",
		"13. Ignore client-submitted timestamps",
		"14. Validate question belongs to quiz/test",
		"15. Validate submitted answer format",
		"16. Prevent answer injection for hidden correct answers",
		"17. Never send correct answers before submission closes",
		"18. Hide grade until teacher/policy releases it",
		"19. Prevent learner from changing score",
		"20. Prevent teacher from grading outside owned class",
		"21. Audit grade changes",
		"22. Store grade history",
		"23. Detect suspicious rapid submissions",
		"24. Detect impossible completion time",
		"25. Rate-limit submission attempts",
		"26. Sanitize assignment text",
		"27. Scan uploaded assignment files through Media/Flag",
		"28. Validate file type for assignment uploads",
		"29. Limit assignment upload size",
		"30. Prevent SQL injection in gradebook filters",
		"31. Use pagination for gradebook access",
		"32. Protect learner progress from other learners",
		"33. Parent can only view linked child progress",
		"34. Sign internal Gamfy award RPC calls",
		"35. Sign internal Notify grade RPC calls",
		"36. Retry notification safely without duplicate grade changes",
		"37. Use transaction for submit, grade, and reward",
		"38. Lock submission row during grading",
		"39. Audit quiz/test publishing",
		"40. Audit assignment deadline changes",
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
