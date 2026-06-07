package mearn

import (
	"errors"
	"regexp"
	"strings"
	"time"

	shared "learnzur/backend/internal/security"
)

const EngineName = "mearn"
const ProtectedSurface = "payments, M-Pesa, earnings, payouts, treasury"
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
	return EngineName + " = payments, M-Pesa, earnings, payouts, treasury"
}

func SecurityRules() []string {
	return []string{
		"1. Verify user authentication before payment action",
		"2. Validate payer role before class payment",
		"3. Validate teacher role before payout request",
		"4. Never trust payment amount from frontend alone",
		"5. Recalculate payable amount on backend",
		"6. Validate class price from database",
		"7. Validate marketplace price from database",
		"8. Use idempotency key for STK push",
		"9. Prevent duplicate payment requests",
		"10. Store pending payment before calling Daraja",
		"11. Verify Daraja callback signature/source",
		"12. Validate callback transaction reference",
		"13. Reject unknown M-Pesa receipt numbers",
		"14. Prevent duplicate callback processing",
		"15. Store raw callback for audit",
		"16. Use DB transaction for payment confirmation",
		"17. Process transaction splits atomically",
		"18. Prevent negative split amounts",
		"19. Validate split percentages total correctly",
		"20. Protect treasury pot updates with transactions",
		"21. Prevent teacher from editing balance",
		"22. Prevent payout above available balance",
		"23. Hold balance until refund window passes",
		"24. Rate-limit payout requests",
		"25. Require admin approval for large payouts",
		"26. Validate M-Pesa phone format",
		"27. Encrypt sensitive phone/payment fields",
		"28. Mask phone numbers in logs",
		"29. Never log payment secrets",
		"30. Store Daraja credentials in environment only",
		"31. Rotate Daraja access tokens securely",
		"32. Detect rapid repeated payments",
		"33. Detect same receipt reused across users",
		"34. Detect suspicious refund patterns",
		"35. Require admin role for treasury adjustments",
		"36. Audit every payout decision",
		"37. Audit every split calculation",
		"38. Audit every refund",
		"39. Sign internal RPC payment calls",
		"40. Reject expired or unsigned engine RPC requests",
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
