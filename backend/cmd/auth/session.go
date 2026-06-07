package auth

import (
	"crypto/rand"
	"crypto/sha256"
	"encoding/base64"
	"encoding/json"
	"learnzur/backend/internal/security"
	supabaseclient "learnzur/backend/internal/supabase"
	"net/http"
	"os"
	"strings"
	"sync"
	"time"
)

const (
	refreshCookieName       = "learnzur_refresh"
	csrfCookieName          = "learnzur_csrf"
	deviceCookieName        = "learnzur_device"
	roleHintCookieName      = "learnzur_role_hint"
	themeCookieName         = "learnzur_theme"
	localeCookieName        = "learnzur_locale"
	lastDashboardCookieName = "learnzur_last_dashboard"
	offlineCookieName       = "learnzur_offline_mode"
)

type storedRefreshSession struct {
	UserID           string
	Role             string
	RefreshTokenHash string
	DeviceID         string
	UserAgent        string
	IPAddress        string
	CreatedAt        time.Time
	ExpiresAt        time.Time
	LastUsedAt       time.Time
	RevokedAt        *time.Time
	RevokeReason     string
}

var refreshSessions = struct {
	sync.RWMutex
	byHash map[string]storedRefreshSession
}{byHash: map[string]storedRefreshSession{}}

func writeJSON(w http.ResponseWriter, value any) {
	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(value)
}

func secureCookieEnabled() bool {
	return !strings.EqualFold(os.Getenv("LEARNZUR_INSECURE_DEV_COOKIES"), "true")
}

func sameSiteMode() http.SameSite {
	switch strings.ToLower(strings.TrimSpace(os.Getenv("LEARNZUR_COOKIE_SAMESITE"))) {
	case "strict":
		return http.SameSiteStrictMode
	default:
		return http.SameSiteLaxMode
	}
}

func randomURLToken(bytesLen int) (string, error) {
	buf := make([]byte, bytesLen)
	if _, err := rand.Read(buf); err != nil {
		return "", err
	}
	return base64.RawURLEncoding.EncodeToString(buf), nil
}

func tokenHash(raw string) string {
	sum := sha256.Sum256([]byte(raw))
	return base64.RawURLEncoding.EncodeToString(sum[:])
}

func clientIP(r *http.Request) string {
	for _, header := range []string{"CF-Connecting-IP", "X-Forwarded-For", "X-Real-IP"} {
		value := strings.TrimSpace(r.Header.Get(header))
		if value != "" {
			return strings.TrimSpace(strings.Split(value, ",")[0])
		}
	}
	return strings.TrimSpace(strings.Split(r.RemoteAddr, ":")[0])
}

func setCookie(w http.ResponseWriter, name, value string, maxAge int, httpOnly bool) {
	http.SetCookie(w, &http.Cookie{Name: name, Value: value, Path: "/", MaxAge: maxAge, HttpOnly: httpOnly, Secure: secureCookieEnabled(), SameSite: sameSiteMode()})
}

func clearCookie(w http.ResponseWriter, name string, httpOnly bool) {
	setCookie(w, name, "", -1, httpOnly)
}

func safeRoleHint(role string) string {
	switch role {
	case "parent", "teacher", "learner", "admin":
		return role
	default:
		return ""
	}
}

func safeDashboardForRole(role string) string {
	switch role {
	case "parent":
		return "/parent/dashboard"
	case "teacher":
		return "/teacher/dashboard"
	case "learner":
		return "/learner/dashboard"
	case "admin":
		return "/admin/dashboard"
	default:
		return "/login"
	}
}

func persistSessionToSupabase(r *http.Request, session storedRefreshSession) {
	_ = supabaseclient.NewFromEnv().Insert(r.Context(), "sessions", map[string]any{
		"user_id":            session.UserID,
		"role":               session.Role,
		"refresh_token_hash": session.RefreshTokenHash,
		"device_id":          session.DeviceID,
		"user_agent":         session.UserAgent,
		"ip_address":         session.IPAddress,
		"created_at":         session.CreatedAt.Format(time.RFC3339),
		"expires_at":         session.ExpiresAt.Format(time.RFC3339),
		"last_used_at":       session.LastUsedAt.Format(time.RFC3339),
	})
	_ = supabaseclient.NewFromEnv().Insert(r.Context(), "device_sessions", map[string]any{
		"user_id":       session.UserID,
		"device_id":     session.DeviceID,
		"user_agent":    session.UserAgent,
		"ip_address":    session.IPAddress,
		"first_seen_at": session.CreatedAt.Format(time.RFC3339),
		"last_seen_at":  session.LastUsedAt.Format(time.RFC3339),
		"trusted":       false,
	})
}

func establishCookieSession(w http.ResponseWriter, r *http.Request, userID, role string) error {
	refreshToken, err := security.SignRefreshToken(userID, role)
	if err != nil {
		return err
	}
	deviceID := ""
	if cookie, err := r.Cookie(deviceCookieName); err == nil {
		deviceID = strings.TrimSpace(cookie.Value)
	}
	if deviceID == "" {
		deviceID, err = randomURLToken(18)
		if err != nil {
			return err
		}
	}
	csrfToken, err := randomURLToken(24)
	if err != nil {
		return err
	}
	now := time.Now().UTC()
	hash := tokenHash(refreshToken)
	refreshSessions.Lock()
	session := storedRefreshSession{UserID: userID, Role: role, RefreshTokenHash: hash, DeviceID: deviceID, UserAgent: r.UserAgent(), IPAddress: clientIP(r), CreatedAt: now, ExpiresAt: now.Add(security.RefreshTokenTTL), LastUsedAt: now}
	refreshSessions.byHash[hash] = session
	refreshSessions.Unlock()
	persistSessionToSupabase(r, session)
	setCookie(w, refreshCookieName, refreshToken, int(security.RefreshTokenTTL.Seconds()), true)
	setCookie(w, csrfCookieName, csrfToken, int(security.RefreshTokenTTL.Seconds()), false)
	setCookie(w, deviceCookieName, deviceID, int((180 * 24 * time.Hour).Seconds()), false)
	setCookie(w, roleHintCookieName, safeRoleHint(role), int(security.RefreshTokenTTL.Seconds()), false)
	setCookie(w, lastDashboardCookieName, safeDashboardForRole(role), int(security.RefreshTokenTTL.Seconds()), false)
	return nil
}

func sessionFromRefreshCookie(r *http.Request) (*security.TokenClaims, error) {
	cookie, err := r.Cookie(refreshCookieName)
	if err != nil || strings.TrimSpace(cookie.Value) == "" {
		return nil, http.ErrNoCookie
	}
	claims, err := security.VerifyAccessToken(cookie.Value)
	if err != nil {
		return nil, err
	}
	hash := tokenHash(cookie.Value)
	refreshSessions.RLock()
	stored, ok := refreshSessions.byHash[hash]
	refreshSessions.RUnlock()
	if !ok || stored.RevokedAt != nil || stored.ExpiresAt.Before(time.Now().UTC()) || stored.UserID != claims.UserID || stored.Role != claims.Role {
		return nil, http.ErrNoCookie
	}
	return claims, nil
}

func Refresh(w http.ResponseWriter, r *http.Request) {
	claims, err := sessionFromRefreshCookie(r)
	if err != nil {
		http.Error(w, "refresh session required", http.StatusUnauthorized)
		return
	}
	oldCookie, _ := r.Cookie(refreshCookieName)
	oldHash := tokenHash(oldCookie.Value)
	now := time.Now().UTC()
	refreshSessions.Lock()
	if old, ok := refreshSessions.byHash[oldHash]; ok {
		old.LastUsedAt = now
		revoked := now
		old.RevokedAt = &revoked
		old.RevokeReason = "rotated"
		refreshSessions.byHash[oldHash] = old
	}
	refreshSessions.Unlock()
	accessToken, err := security.SignAccessToken(claims.UserID, claims.Role)
	if err != nil {
		http.Error(w, "token creation failed", http.StatusInternalServerError)
		return
	}
	if err := establishCookieSession(w, r, claims.UserID, claims.Role); err != nil {
		http.Error(w, "session rotation failed", http.StatusInternalServerError)
		return
	}
	writeJSON(w, map[string]any{"accessToken": accessToken, "expiresInSeconds": int(security.AccessTokenTTL.Seconds()), "user": map[string]any{"id": claims.UserID, "role": claims.Role}, "rotation": "complete"})
}

func Logout(w http.ResponseWriter, r *http.Request) {
	if cookie, err := r.Cookie(refreshCookieName); err == nil {
		hash := tokenHash(cookie.Value)
		refreshSessions.Lock()
		if stored, ok := refreshSessions.byHash[hash]; ok {
			now := time.Now().UTC()
			stored.RevokedAt = &now
			stored.RevokeReason = "logout"
			refreshSessions.byHash[hash] = stored
		}
		refreshSessions.Unlock()
	}
	clearAuthCookies(w)
	writeJSON(w, map[string]any{"status": "logged_out"})
}

func LogoutAll(w http.ResponseWriter, r *http.Request) {
	claims, err := sessionFromRefreshCookie(r)
	if err != nil {
		http.Error(w, "refresh session required", http.StatusUnauthorized)
		return
	}
	now := time.Now().UTC()
	refreshSessions.Lock()
	for hash, stored := range refreshSessions.byHash {
		if stored.UserID == claims.UserID {
			stored.RevokedAt = &now
			stored.RevokeReason = "logout_all"
			refreshSessions.byHash[hash] = stored
		}
	}
	refreshSessions.Unlock()
	clearAuthCookies(w)
	writeJSON(w, map[string]any{"status": "all_sessions_revoked"})
}

func CurrentSession(w http.ResponseWriter, r *http.Request) {
	claims, err := sessionFromRefreshCookie(r)
	if err != nil {
		http.Error(w, "no active session", http.StatusUnauthorized)
		return
	}
	writeJSON(w, map[string]any{"status": "active", "user": map[string]any{"id": claims.UserID, "role": claims.Role}, "cookies": []string{refreshCookieName, csrfCookieName, deviceCookieName}})
}

func CSRF(w http.ResponseWriter, r *http.Request) {
	csrfToken, err := randomURLToken(24)
	if err != nil {
		http.Error(w, "csrf creation failed", http.StatusInternalServerError)
		return
	}
	setCookie(w, csrfCookieName, csrfToken, int(security.RefreshTokenTTL.Seconds()), false)
	writeJSON(w, map[string]any{"csrfToken": csrfToken, "cookie": csrfCookieName})
}

func clearAuthCookies(w http.ResponseWriter) {
	clearCookie(w, refreshCookieName, true)
	clearCookie(w, csrfCookieName, false)
	clearCookie(w, roleHintCookieName, false)
	clearCookie(w, lastDashboardCookieName, false)
}

func RememberSafePreference(w http.ResponseWriter, name, value string) {
	switch name {
	case themeCookieName, localeCookieName, offlineCookieName:
		setCookie(w, name, security.Sanitize(value), int((365 * 24 * time.Hour).Seconds()), false)
	}
}
