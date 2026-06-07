package flag

import (
	"context"
	"strings"

	"learnzur/backend/engines/flag/internal/flag/providers"
	shared "learnzur/backend/internal/security"
)

func RunAiScanner() string { return "flag.ai_scanner.gemini_openrouter_deepseek" }

func ScanChatInSandbox(ctx context.Context, req ChatScanRequest) ChatScanResult {
	message := shared.Sanitize(req.Message)
	provider := providers.ProviderFromEnv()
	verdict := providers.ScanWithGemini(ctx, message)
	switch provider {
	case "openrouter":
		verdict = providers.ScanWithOpenRouter(ctx, message)
	case "deepseek":
		verdict = providers.ScanWithDeepSeek(ctx, message)
	}
	banned := !verdict.Allowed && (strings.EqualFold(verdict.Severity, "high") || strings.EqualFold(verdict.Severity, "critical"))
	return ChatScanResult{SandboxID: "flag-sandbox-" + safeID(req.RoomID) + "-" + safeID(req.UserID), Allowed: verdict.Allowed, Banned: banned, Severity: verdict.Severity, Provider: verdict.Provider, Reason: verdict.Reason, CreatedAt: nowUTC()}
}

func safeID(value string) string {
	value = strings.TrimSpace(value)
	if value == "" {
		return "unknown"
	}
	return strings.Map(func(r rune) rune {
		if (r >= 'a' && r <= 'z') || (r >= 'A' && r <= 'Z') || (r >= '0' && r <= '9') || r == '_' || r == '-' {
			return r
		}
		return '-'
	}, value)
}
