package auth

import (
	"context"
	"encoding/json"
	"net/http"
	"net/url"
	"os"
	"strings"
	"time"
)

type captchaPayload struct {
	HCaptchaToken string `json:"hcaptchaToken"`
}

type hcaptchaVerifyResponse struct {
	Success     bool     `json:"success"`
	ChallengeTS string   `json:"challenge_ts"`
	Hostname    string   `json:"hostname"`
	ErrorCodes  []string `json:"error-codes"`
}

func verifyHCaptchaToken(ctx context.Context, token string) bool {
	secret := strings.TrimSpace(os.Getenv("HCAPTCHA_SECRET"))
	if secret == "" && strings.EqualFold(os.Getenv("HCAPTCHA_BYPASS_IN_DEV"), "true") {
		return true
	}
	if secret == "" || strings.TrimSpace(token) == "" {
		return false
	}
	form := url.Values{}
	form.Set("secret", secret)
	form.Set("response", token)
	req, err := http.NewRequestWithContext(ctx, http.MethodPost, "https://hcaptcha.com/siteverify", strings.NewReader(form.Encode()))
	if err != nil {
		return false
	}
	req.Header.Set("Content-Type", "application/x-www-form-urlencoded")
	client := &http.Client{Timeout: 5 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		return false
	}
	defer resp.Body.Close()
	var result hcaptchaVerifyResponse
	if json.NewDecoder(resp.Body).Decode(&result) != nil {
		return false
	}
	return result.Success
}

func hcaptchaOK(r *http.Request, token string) bool {
	ctx, cancel := context.WithTimeout(r.Context(), 6*time.Second)
	defer cancel()
	return verifyHCaptchaToken(ctx, token)
}
