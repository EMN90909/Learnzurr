package middleware

import (
	"encoding/json"
	"net/http"
	"sync"
	"time"
)

type bucket struct {
	count int
	reset time.Time
}
type Limiter struct {
	mu     sync.Mutex
	hits   map[string]bucket
	Limit  int
	Window time.Duration
}

func NewLimiter(limit int, window time.Duration) *Limiter {
	return &Limiter{hits: map[string]bucket{}, Limit: limit, Window: window}
}
func (l *Limiter) Wrap(name string, next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		key := name + ":" + r.RemoteAddr
		now := time.Now()
		l.mu.Lock()
		b := l.hits[key]
		if now.After(b.reset) {
			b = bucket{reset: now.Add(l.Window)}
		}
		b.count++
		l.hits[key] = b
		l.mu.Unlock()
		if b.count > l.Limit {
			JSON(w, 429, map[string]string{"error": "Too many requests. Please try again shortly."})
			return
		}
		next.ServeHTTP(w, r)
	})
}
func JSON(w http.ResponseWriter, status int, payload any) {
	w.Header().Set("content-type", "application/json")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(payload)
}
func SecurityHeaders(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("x-content-type-options", "nosniff")
		w.Header().Set("x-frame-options", "DENY")
		w.Header().Set("referrer-policy", "strict-origin-when-cross-origin")
		next.ServeHTTP(w, r)
	})
}
