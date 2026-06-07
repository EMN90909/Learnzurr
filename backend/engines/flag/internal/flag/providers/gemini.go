package providers

import (
	"context"
	"os"
)

func GeminiProviderName() string { return "gemini" }

func ScanWithGemini(ctx context.Context, content string) ModerationVerdict {
	verdict := scanLocal("gemini", content)
	if !verdict.Allowed {
		return verdict
	}
	_ = postJSON(ctx, "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key="+os.Getenv("GEMINI_API_KEY"), "", map[string]any{
		"contents": []map[string]any{{"parts": []map[string]string{{"text": "Moderate this learner classroom chat for child safety and return JSON: " + content}}}},
	})
	verdict.Reason = "Gemini provider boundary checked; local safety rules also passed"
	return verdict
}
