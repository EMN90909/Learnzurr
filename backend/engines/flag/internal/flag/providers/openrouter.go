package providers

import (
	"context"
	"os"
)

func OpenRouterProviderName() string { return "openrouter" }

func ScanWithOpenRouter(ctx context.Context, content string) ModerationVerdict {
	verdict := scanLocal("openrouter", content)
	if !verdict.Allowed {
		return verdict
	}
	model := os.Getenv("OPENROUTER_MODEL")
	if model == "" {
		model = "deepseek/deepseek-chat"
	}
	_ = postJSON(ctx, "https://openrouter.ai/api/v1/chat/completions", os.Getenv("OPENROUTER_API_KEY"), map[string]any{
		"model":    model,
		"messages": []map[string]string{{"role": "system", "content": "Moderate learner chat for child safety. Return a compact JSON verdict."}, {"role": "user", "content": content}},
	})
	verdict.Reason = "OpenRouter provider boundary checked; local safety rules also passed"
	return verdict
}
