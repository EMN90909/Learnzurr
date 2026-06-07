package notify

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

type ResendEmail struct {
	To      string `json:"to"`
	Subject string `json:"subject"`
	HTML    string `json:"html"`
}

type ResendClient struct {
	APIKey string
	From   string
	HTTP   *http.Client
}

func NewResendClient() ResendClient {
	from := strings.TrimSpace(os.Getenv("RESEND_FROM_EMAIL"))
	if from == "" {
		from = "Learnzur <noreply@learnzur.app>"
	}
	return ResendClient{APIKey: os.Getenv("RESEND_API_KEY"), From: from, HTTP: &http.Client{Timeout: 8 * time.Second}}
}

func (c ResendClient) Send(ctx context.Context, email ResendEmail) error {
	if strings.TrimSpace(c.APIKey) == "" || c.APIKey == "replace-me" {
		return errors.New("RESEND_API_KEY is not configured")
	}
	payload := map[string]any{"from": c.From, "to": []string{email.To}, "subject": email.Subject, "html": email.HTML}
	body, err := json.Marshal(payload)
	if err != nil {
		return err
	}
	req, err := http.NewRequestWithContext(ctx, http.MethodPost, "https://api.resend.com/emails", bytes.NewReader(body))
	if err != nil {
		return err
	}
	req.Header.Set("Authorization", "Bearer "+c.APIKey)
	req.Header.Set("Content-Type", "application/json")
	resp, err := c.HTTP.Do(req)
	if err != nil {
		return err
	}
	defer resp.Body.Close()
	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		return errors.New("resend email send failed")
	}
	return nil
}

func EmailProviderName() string { return "resend" }
