package main

import (
	"encoding/json"
	"learnzur/backend/internal/cache"
	"learnzur/backend/internal/db"
	"learnzur/backend/internal/middleware"
	"log"
	"net/http"
	"os"
)

func main() {
	cfg := db.FromEnv()
	redis := cache.FromEnv()
	mux := http.NewServeMux()
	mux.HandleFunc("/api/health", func(w http.ResponseWriter, r *http.Request) {
		middleware.JSON(w, 200, map[string]any{"ok": true, "service": "api", "supabaseConfigured": cfg.SupabaseURL != "", "redisConfigured": redis.URL != ""})
	})
	mux.HandleFunc("/api/engines", func(w http.ResponseWriter, r *http.Request) {
		_ = json.NewEncoder(w).Encode([]string{"gamfy", "mearn", "lms", "classroom", "san", "lanmat", "notify", "media", "find"})
	})
	addr := env("API_ADDR", ":8080")
	log.Printf("learnzur api listening on %s", addr)
	log.Fatal(http.ListenAndServe(addr, middleware.SecurityHeaders(mux)))
}
func env(k, d string) string {
	if v := os.Getenv(k); v != "" {
		return v
	}
	return d
}
