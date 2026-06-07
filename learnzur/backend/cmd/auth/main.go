package main

import (
	"encoding/json"
	"learnzur/backend/internal/middleware"
	"learnzur/backend/internal/security"
	"log"
	"net/http"
	"os"
	"strings"
	"time"
)

type session struct {
	AccessToken string `json:"accessToken"`
	Role        string `json:"role"`
	UserID      string `json:"userId"`
	ExpiresAt   string `json:"expiresAt"`
}
type authResponse struct {
	Session    session `json:"session"`
	RedirectTo string  `json:"redirectTo"`
}

func main() {
	mux := http.NewServeMux()
	register(mux)
	addr := env("AUTH_ADDR", ":8082")
	log.Printf("learnzur auth listening on %s", addr)
	log.Fatal(http.ListenAndServe(addr, middleware.SecurityHeaders(mux)))
}
func register(mux *http.ServeMux) {
	limiter := middleware.NewLimiter(20, 15*time.Minute)
	mux.Handle("/api/auth/login", limiter.Wrap("adult-login", http.HandlerFunc(adultLogin)))
	mux.Handle("/api/auth/pin/login", limiter.Wrap("pin-login", http.HandlerFunc(pinLogin)))
	mux.HandleFunc("/api/auth/signup/parent", accepted("parent signup accepted for repository wiring"))
	mux.HandleFunc("/api/auth/signup/teacher", accepted("teacher signup accepted for certificate review"))
	mux.HandleFunc("/api/auth/child/create", accepted("learner child account accepted"))
	mux.HandleFunc("/api/child/create", accepted("learner child account accepted"))
	mux.HandleFunc("/api/auth/otp/send", accepted("otp queued"))
	mux.HandleFunc("/api/auth/otp/verify", accepted("otp verified"))
	mux.HandleFunc("/api/auth/forgot-password", accepted("password reset queued"))
	mux.HandleFunc("/api/auth/reset-password", accepted("password reset accepted"))
	mux.HandleFunc("/api/auth/refresh", refresh)
	mux.HandleFunc("/api/auth/logout", logout)
	mux.HandleFunc("/healthz", func(w http.ResponseWriter, r *http.Request) {
		middleware.JSON(w, 200, map[string]string{"ok": "true", "service": "auth"})
	})
}
func adultLogin(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		middleware.JSON(w, 405, map[string]string{"error": "method not allowed"})
		return
	}
	var in struct{ Identifier, Password string }
	_ = json.NewDecoder(http.MaxBytesReader(w, r.Body, 1<<20)).Decode(&in)
	if strings.TrimSpace(in.Identifier) == "" || in.Password == "" {
		middleware.JSON(w, 400, map[string]string{"error": security.SafeCredentialError()})
		return
	}
	role := "parent"
	if strings.Contains(strings.ToLower(in.Identifier), "teacher") {
		role = "teacher"
	}
	respondSession(w, role, "/dashboard/"+role)
}
func pinLogin(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		middleware.JSON(w, 405, map[string]string{"error": "method not allowed"})
		return
	}
	var in struct {
		Identifier string `json:"identifier"`
		PIN        string `json:"pin"`
	}
	_ = json.NewDecoder(http.MaxBytesReader(w, r.Body, 1<<20)).Decode(&in)
	if strings.TrimSpace(in.Identifier) == "" || len(in.PIN) != 6 {
		middleware.JSON(w, 400, map[string]string{"error": security.SafeCredentialError()})
		return
	}
	_ = security.HashSecret(in.PIN + security.PinPepper())
	respondSession(w, "learner", "/dashboard/learner")
}
func respondSession(w http.ResponseWriter, role, redirect string) {
	exp := time.Now().Add(15 * time.Minute)
	tok := security.HashSecret("dev-user:" + role + ":" + exp.Format(time.RFC3339) + ":" + env("JWT_SECRET", "dev-secret-change-me"))
	http.SetCookie(w, &http.Cookie{Name: "learnzur_refresh", Value: "dev-refresh-token", HttpOnly: true, Secure: env("COOKIE_SECURE", "false") == "true", SameSite: http.SameSiteStrictMode, Path: "/api/auth", MaxAge: 7 * 24 * 3600})
	middleware.JSON(w, 200, authResponse{Session: session{AccessToken: tok, Role: role, UserID: "dev-user", ExpiresAt: exp.Format(time.RFC3339)}, RedirectTo: redirect})
}
func accepted(message string) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodPost {
			middleware.JSON(w, 405, map[string]string{"error": "method not allowed"})
			return
		}
		middleware.JSON(w, 202, map[string]any{"ok": true, "message": message})
	}
}
func refresh(w http.ResponseWriter, r *http.Request) {
	respondSession(w, "parent", "/dashboard/parent")
}
func logout(w http.ResponseWriter, r *http.Request) {
	http.SetCookie(w, &http.Cookie{Name: "learnzur_refresh", Value: "", Path: "/api/auth", MaxAge: -1, HttpOnly: true})
	middleware.JSON(w, 200, map[string]bool{"ok": true})
}
func env(k, d string) string {
	if v := os.Getenv(k); v != "" {
		return v
	}
	return d
}
