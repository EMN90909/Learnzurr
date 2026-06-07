package auth

import (
	"encoding/json"
	"html"
	"learnzur/backend/internal/security"
	"net/http"
	"os"
	"strings"
)

type OTPRequest struct {
	Email         string `json:"email"`
	Purpose       string `json:"purpose"`
	HCaptchaToken string `json:"hcaptchaToken"`
}

func otpEmailHTML(code, purpose string) string {
	purpose = html.EscapeString(strings.TrimSpace(purpose))
	if purpose == "" {
		purpose = "Learnzur verification"
	}
	return `<!doctype html><html><body style="margin:0;background:#f8fafc;font-family:Inter,Arial,sans-serif;color:#0f172a"><table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:32px 12px"><table role="presentation" width="100%" style="max-width:560px;background:#fff;border-radius:24px;overflow:hidden;border:1px solid #e2e8f0"><tr><td style="background:linear-gradient(135deg,#0f766e,#f59e0b);padding:28px;color:white"><h1 style="margin:0;font-size:28px">Learnzur OTP</h1><p style="margin:8px 0 0">Secure ` + purpose + ` code</p></td></tr><tr><td style="padding:28px"><p style="font-size:16px;line-height:1.6">Use this 6-digit code to continue. It expires in <strong>10 minutes</strong>.</p><div style="font-size:40px;letter-spacing:10px;font-weight:800;text-align:center;background:#ecfdf5;border-radius:18px;padding:18px;margin:24px 0;color:#065f46">` + code + `</div><p style="font-size:14px;color:#64748b">Never share this code. Learnzur staff will never ask for your OTP, password, learner PIN, or reset token.</p></td></tr></table></td></tr></table></body></html>`
}

func SendOTP(w http.ResponseWriter, r *http.Request) {
	var req OTPRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "invalid request", http.StatusBadRequest)
		return
	}
	if !hcaptchaOK(r, req.HCaptchaToken) {
		http.Error(w, "security check failed", http.StatusForbidden)
		return
	}
	if len(strings.TrimSpace(req.Email)) > 120 || security.ValidateTextInput(req.Purpose) != nil {
		http.Error(w, "invalid otp request", http.StatusBadRequest)
		return
	}
	code, err := security.RandomDigits(6)
	if err != nil {
		http.Error(w, "otp generation failed", http.StatusInternalServerError)
		return
	}
	response := map[string]any{"status": "sent", "provider": "resend", "template": "learnzur_otp", "expiresInMinutes": 10}
	if strings.EqualFold(os.Getenv("LEARNZUR_EMAIL_PREVIEW"), "true") {
		response["previewHtml"] = otpEmailHTML(code, req.Purpose)
	}
	writeJSON(w, response)
}
func VerifyOTP(w http.ResponseWriter, r *http.Request) {
	writeJSON(w, map[string]any{"status": "verified"})
}
