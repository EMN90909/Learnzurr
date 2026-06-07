package media

import (
	"errors"
	"regexp"
	"strings"
	"time"

	shared "learnzur/backend/internal/security"
)

const EngineName = "media"
const ProtectedSurface = "uploads, videos, PDFs, certificates, storage"
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
	return EngineName + " = uploads, videos, PDFs, certificates, storage"
}

func SecurityRules() []string {
	return []string{
		"1. Verify user authentication before upload",
		"2. Check user owns uploaded asset",
		"3. Validate MIME type",
		"4. Validate file extension",
		"5. Validate file size",
		"6. Reject executable files",
		"7. Reject dangerous archive formats if unsupported",
		"8. Scan uploaded files for unsafe content",
		"9. Strip metadata from images/videos where needed",
		"10. Generate safe storage filenames",
		"11. Prevent path traversal",
		"12. Store files outside public root",
		"13. Use signed URLs for private assets",
		"14. Expire signed URLs",
		"15. Prevent unauthorized downloads",
		"16. Check class/material ownership before access",
		"17. Parent can only access child reports",
		"18. Teacher can only access own class materials",
		"19. Validate video encoding job ownership",
		"20. Prevent duplicate encoding jobs",
		"21. Limit encoding duration",
		"22. Limit FFmpeg CPU/memory usage",
		"23. Sanitize FFmpeg inputs",
		"24. Never pass raw user input into shell commands",
		"25. Use argument arrays instead of shell strings",
		"26. Validate PDF template names",
		"27. Prevent HTML injection in PDF templates",
		"28. Sanitize certificate/report data",
		"29. Prevent fake certificate generation",
		"30. Validate certificate issuer authority",
		"31. Audit certificate creation",
		"32. Audit report card PDF creation",
		"33. Audit file deletion",
		"34. Prevent user from deleting another user\u2019s asset",
		"35. Rate-limit uploads",
		"36. Rate-limit render jobs",
		"37. Enforce user storage quota",
		"38. Detect suspicious upload patterns",
		"39. Sign internal RPC media requests",
		"40. Store immutable media job logs",
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
