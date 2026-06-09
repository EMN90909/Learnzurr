package middleware

import "net/http"
func Compress(next http.Handler) http.Handler { return next }
