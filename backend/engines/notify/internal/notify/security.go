package notify

import (
	"errors"
	"regexp"
	"strings"
	"time"

	shared "learnzur/backend/internal/security"
)

const EngineName = "notify"
const ProtectedSurface = "push notifications, emails, reminders"
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
	return EngineName + " = push notifications, emails, reminders"
}

func SecurityRules() []string {
	return []string{
		"1. Verify user authentication for subscription changes",
		"2. Validate push subscription endpoint",
		"3. Prevent duplicate subscriptions",
		"4. Encrypt or protect push subscription keys",
		"5. Validate notification recipient exists",
		"6. Ensure user can only read own notifications",
		"7. Parent can only receive child-related alerts if linked",
		"8. Teacher can only notify own class",
		"9. Admin-only platform-wide announcements",
		"10. Rate-limit notification sends",
		"11. Rate-limit email sends",
		"12. Prevent notification spam loops",
		"13. Respect notification preferences",
		"14. Respect unsubscribe tokens",
		"15. Validate unsubscribe token expiry",
		"16. Prevent sending to unsubscribed email",
		"17. Sanitize notification title",
		"18. Sanitize notification body",
		"19. Prevent HTML/script injection in emails",
		"20. Use safe email templates only",
		"21. Never expose OTP in logs",
		"22. Never expose reset tokens in logs",
		"23. Hash unsubscribe/reset tokens",
		"24. Expire scheduled notification safely",
		"25. Prevent duplicate scheduled reminders",
		"26. Use idempotency key for notifications",
		"27. Sign internal RPC notification requests",
		"28. Validate calling engine",
		"29. Reject unknown notification type",
		"30. Restrict urgent alerts to trusted engines",
		"31. Store delivery logs",
		"32. Avoid storing sensitive message payloads unnecessarily",
		"33. Mask emails in logs",
		"34. Validate SMTP credentials from env only",
		"35. Validate VAPID keys from env only",
		"36. Retry failed sends safely",
		"37. Prevent infinite retry loops",
		"38. Audit admin announcements",
		"39. Audit failed critical alerts",
		"40. Alert admin on notification abuse patterns",
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
