package auth

import (
	"context"
	"crypto/sha256"
	"encoding/base64"
	"encoding/json"
	"errors"
	"learnzur/backend/internal/security"
	supabaseclient "learnzur/backend/internal/supabase"
	"net/http"
	"strings"
	"time"
)

type LoginRequest struct {
	Identifier    string `json:"identifier"`
	Password      string `json:"password"`
	Username      string `json:"username"`
	PIN           string `json:"pin"`
	HCaptchaToken string `json:"hcaptchaToken"`
}

func tokenFor(id, role string) (string, error) {
	return security.SignAccessToken(id, role)
}

func userIDFrom(value string) string {
	clean := strings.TrimSpace(strings.ToLower(value))
	if clean == "" {
		clean = "learnzur-user"
	}
	sum := sha256.Sum256([]byte(clean))
	return "lz_" + base64.RawURLEncoding.EncodeToString(sum[:])[:18]
}

func roleFromIdentifier(identifier string) string {
	lowered := strings.ToLower(strings.TrimSpace(identifier))
	ctx, cancel := context.WithTimeout(context.Background(), 3*time.Second)
	defer cancel()
	isAdmin, err := supabaseclient.NewFromEnv().IsAdminEmail(ctx, lowered)
	if err == nil && isAdmin {
		return "admin"
	}
	if strings.Contains(lowered, "teacher") || strings.Contains(lowered, "school") || strings.Contains(lowered, "org") {
		return "teacher"
	}
	return "parent"
}

func validateAdultLogin(req LoginRequest) error {
	id := strings.TrimSpace(req.Identifier)
	if id == "" || len(id) > 120 {
		return errors.New("invalid credentials")
	}
	if req.Password == "" || len(req.Password) > 128 {
		return errors.New("invalid credentials")
	}
	if security.ValidateTextInput(id) != nil {
		return errors.New("invalid credentials")
	}
	return nil
}

func Login(w http.ResponseWriter, r *http.Request) {
	var req LoginRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "invalid request", http.StatusBadRequest)
		return
	}
	if !hcaptchaOK(r, req.HCaptchaToken) {
		http.Error(w, "security check failed", http.StatusForbidden)
		return
	}
	if err := validateAdultLogin(req); err != nil {
		http.Error(w, "invalid credentials", http.StatusUnauthorized)
		return
	}
	client := supabaseclient.NewFromEnv()
	if !client.AuthConfigured() {
		http.Error(w, "auth provider is not configured", http.StatusServiceUnavailable)
		return
	}
	if err := client.VerifyPasswordLogin(r.Context(), strings.TrimSpace(req.Identifier), req.Password); err != nil {
		http.Error(w, "invalid credentials", http.StatusUnauthorized)
		return
	}
	role := roleFromIdentifier(req.Identifier)
	uid := userIDFrom(req.Identifier)
	accessToken, err := tokenFor(uid, role)
	if err != nil {
		http.Error(w, "token creation failed", http.StatusInternalServerError)
		return
	}
	if err := establishCookieSession(w, r, uid, role); err != nil {
		http.Error(w, "session creation failed", http.StatusInternalServerError)
		return
	}
	writeJSON(w, map[string]any{"accessToken": accessToken, "expiresInSeconds": int(security.AccessTokenTTL.Seconds()), "user": map[string]any{"id": uid, "role": role, "name": "Learnzur User"}})
}

func PinLogin(w http.ResponseWriter, r *http.Request) {
	var req LoginRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "invalid request", http.StatusBadRequest)
		return
	}
	if !hcaptchaOK(r, req.HCaptchaToken) {
		http.Error(w, "security check failed", http.StatusForbidden)
		return
	}
	username := strings.ToLower(strings.TrimSpace(req.Username))
	if username == "" || len(username) > 80 || len(req.PIN) != 6 || security.ValidateTextInput(username) != nil {
		http.Error(w, "invalid credentials", http.StatusUnauthorized)
		return
	}
	client := supabaseclient.NewFromEnv()
	if !client.DataConfigured() {
		http.Error(w, "auth provider is not configured", http.StatusServiceUnavailable)
		return
	}
	rows, err := client.Select(r.Context(), "learner_profiles", "user_id,username,pin_hash", map[string]string{"username": "eq." + username}, 1)
	if err != nil || len(rows) != 1 {
		http.Error(w, "invalid credentials", http.StatusUnauthorized)
		return
	}
	pinHash, _ := rows[0]["pin_hash"].(string)
	uid, _ := rows[0]["user_id"].(string)
	if uid == "" || pinHash == "" || !security.VerifyPIN(req.PIN, pinHash) {
		http.Error(w, "invalid credentials", http.StatusUnauthorized)
		return
	}
	accessToken, err := tokenFor(uid, "learner")
	if err != nil {
		http.Error(w, "token creation failed", http.StatusInternalServerError)
		return
	}
	if err := establishCookieSession(w, r, uid, "learner"); err != nil {
		http.Error(w, "session creation failed", http.StatusInternalServerError)
		return
	}
	writeJSON(w, map[string]any{"accessToken": accessToken, "expiresInSeconds": int(security.AccessTokenTTL.Seconds()), "user": map[string]any{"id": uid, "role": "learner", "name": username}})
}
