package middleware

import (
	"learnzur/backend/internal/performance"
	"log"
	"net/http"
	"strings"
	"time"
)

func Logger(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path == "/api/health" || r.URL.Path == "/health" {
			next.ServeHTTP(w, r)
			return
		}
		start := time.Now()
		safeQuery := r.URL.RawQuery
		lower := strings.ToLower(safeQuery)
		for _, key := range []string{"password", "token", "pin", "otp", "secret"} {
			if strings.Contains(lower, key) {
				safeQuery = "[masked]"
				break
			}
		}
		next.ServeHTTP(w, r)
		line := performance.WithBuilder(func(b *strings.Builder) {
			b.WriteString("method=")
			b.WriteString(r.Method)
			b.WriteString(" path=")
			b.WriteString(r.URL.Path)
			b.WriteString(" query=")
			b.WriteString(safeQuery)
			b.WriteString(" duration_ms=")
			b.WriteString(time.Since(start).String())
		})
		log.Print(line)
	})
}
