package providers

import (
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"net/http"
	"os"
	"strings"
	"time"
)

type ModerationVerdict struct {
	Provider string `json:"provider"`
	Allowed  bool   `json:"allowed"`
	Severity string `json:"severity"`
	Category string `json:"category"`
	Reason   string `json:"reason"`
}

func scanLocal(provider string, content string) ModerationVerdict {
	lowered := strings.ToLower(content)
	blocked := []string{"kill yourself", "nude", "sex", "terror", "bomb", "password", "token"}
	for _, word := range blocked {
		if strings.Contains(lowered, word) {
			return ModerationVerdict{Provider: provider, Allowed: false, Severity: "high", Category: "unsafe_chat", Reason: "matched unsafe learner-safety term"}
		}
	}
	return ModerationVerdict{Provider: provider, Allowed: true, Severity: "clear", Category: "safe", Reason: "no unsafe pattern detected"}
}

func postJSON(ctx context.Context, endpoint string, apiKey string, payload map[string]any) error {
	if strings.TrimSpace(apiKey) == "" {
		return errors.New("api key is not configured")
	}
	body, err := json.Marshal(payload)
	if err != nil {
		return err
	}
	req, err := http.NewRequestWithContext(ctx, http.MethodPost, endpoint, bytes.NewReader(body))
	if err != nil {
		return err
	}
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+apiKey)
	client := &http.Client{Timeout: 8 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		return err
	}
	defer resp.Body.Close()
	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		return errors.New("provider request failed")
	}
	return nil
}

func ProviderFromEnv() string {
	p := strings.ToLower(strings.TrimSpace(os.Getenv("FLAG_PROVIDER")))
	switch p {
	case "gemini", "openrouter", "deepseek":
		return p
	}
	return "gemini"
}
