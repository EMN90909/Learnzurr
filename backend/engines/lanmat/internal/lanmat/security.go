package lanmat

import (
	"errors"
	"regexp"
	"strings"
	"time"

	shared "learnzur/backend/internal/security"
)

const EngineName = "lanmat"
const ProtectedSurface = "marketplace, purchases, approvals, royalties"
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
	return EngineName + " = marketplace, purchases, approvals, royalties"
}

func SecurityRules() []string {
	return []string{
		"1. Verify user authentication",
		"2. Check seller eligibility before listing",
		"3. Enforce age rules for learner sellers",
		"4. Require parent approval for child purchases",
		"5. Require admin approval before listing goes live",
		"6. Scan listing title with Flag",
		"7. Scan listing description with Flag",
		"8. Scan listing files through Media/Flag",
		"9. Reject prohibited marketplace items",
		"10. Validate listing category",
		"11. Validate price minimum",
		"12. Validate price maximum",
		"13. Prevent seller from buying own item",
		"14. Prevent duplicate purchase processing",
		"15. Use Mearn for payment confirmation only",
		"16. Never trust frontend payment status",
		"17. Verify purchase belongs to buyer",
		"18. Use signed URLs for purchased files",
		"19. Prevent unpaid file download",
		"20. Expire download links",
		"21. Protect seller identity for minors",
		"22. Hide child seller private info",
		"23. Rate-limit listing submissions",
		"24. Rate-limit purchase attempts",
		"25. Detect suspicious repeated purchases",
		"26. Detect fake review attempts",
		"27. Only verified buyers can review",
		"28. Prevent duplicate reviews per purchase",
		"29. Audit listing approval/rejection",
		"30. Audit purchase fulfillment",
		"31. Audit royalty calculation",
		"32. Validate royalty split before payout",
		"33. Sign RPC call to Flag engine",
		"34. Sign RPC call to Mearn engine",
		"35. Sign RPC call to Notify engine",
		"36. Prevent listing edits after approval without re-review",
		"37. Keep listing version history",
		"38. Allow admin takedown of unsafe listings",
		"39. Restrict admin marketplace actions by role",
		"40. Store immutable marketplace audit logs",
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
