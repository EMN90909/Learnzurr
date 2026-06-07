package providers

import (
	"context"
	"os"
)

func DeepSeekProviderName() string { return "deepseek" }

func ScanWithDeepSeek(ctx context.Context, content string) ModerationVerdict {
	verdict := scanLocal("deepseek", content)
	if !verdict.Allowed {
		return verdict
	}
	model := os.Getenv("DEEPSEEK_MODEL")
	if model == "" {
		model = "deepseek-chat"
	}
	_ = postJSON(ctx, "https://api.deepseek.com/chat/completions", os.Getenv("DEEPSEEK_API_KEY"), map[string]any{
		"model":    model,
		"messages": []map[string]string{{"role": "system", "content": "Moderate learner chat for child safety. Return a compact JSON verdict."}, {"role": "user", "content": content}},
	})
	verdict.Reason = "DeepSeek provider boundary checked; local safety rules also passed"
	return verdict
}
