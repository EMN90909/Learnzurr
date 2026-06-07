package auth

import (
	"encoding/json"
	"net/http"
)

type PasswordRequest struct {
	Email         string `json:"email"`
	Token         string `json:"token"`
	Password      string `json:"password"`
	HCaptchaToken string `json:"hcaptchaToken"`
}

func ForgotPassword(w http.ResponseWriter, r *http.Request) {
	var req PasswordRequest
	_ = json.NewDecoder(r.Body).Decode(&req)
	if !hcaptchaOK(r, req.HCaptchaToken) {
		http.Error(w, "security check failed", http.StatusForbidden)
		return
	}
	writeJSON(w, map[string]any{"status": "accepted", "provider": "resend", "message": "If the account exists, a reset email will be sent."})
}
func ResetPassword(w http.ResponseWriter, r *http.Request) {
	var req PasswordRequest
	_ = json.NewDecoder(r.Body).Decode(&req)
	if !hcaptchaOK(r, req.HCaptchaToken) {
		http.Error(w, "security check failed", http.StatusForbidden)
		return
	}
	writeJSON(w, map[string]any{"status": "reset"})
}
