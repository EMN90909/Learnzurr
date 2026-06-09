package middleware

import "net/http"
func RateLimit(next http.Handler) http.Handler { return next }
