package middleware

import (
	"net/http"
	"os"
	"strings"
)

func allowedOrigin(origin string) bool {
	if origin == "" {
		return true
	}
	configured := os.Getenv("LEARNZUR_ALLOWED_ORIGINS")
	if configured == "" {
		configured = "http://localhost:8080,http://localhost:5173,http://localhost:3000"
	}
	for _, item := range strings.Split(configured, ",") {
		if strings.TrimSpace(item) == origin {
			return true
		}
	}
	return false
}

func CORS(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		origin := r.Header.Get("Origin")
		if !allowedOrigin(origin) {
			http.Error(w, "origin not allowed", http.StatusForbidden)
			return
		}
		if origin != "" {
			w.Header().Set("Access-Control-Allow-Origin", origin)
		}
		w.Header().Set("Vary", "Origin")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Learnzur-Client")
		w.Header().Set("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS")
		w.Header().Set("Access-Control-Allow-Credentials", "true")
		if r.Method == "OPTIONS" {
			w.WriteHeader(http.StatusNoContent)
			return
		}
		next.ServeHTTP(w, r)
	})
}
