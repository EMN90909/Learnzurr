package middleware

import (
	"net"
	"net/http"
	"sync"
	"time"
)

type visitor struct {
	count int
	reset time.Time
}

var limiter = struct {
	sync.Mutex
	visits map[string]*visitor
}{visits: map[string]*visitor{}}

func RateLimit(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		ip, _, err := net.SplitHostPort(r.RemoteAddr)
		if err != nil {
			ip = r.RemoteAddr
		}
		now := time.Now()
		limiter.Lock()
		v := limiter.visits[ip]
		if v == nil || now.After(v.reset) {
			v = &visitor{count: 0, reset: now.Add(time.Minute)}
			limiter.visits[ip] = v
		}
		v.count++
		over := v.count > 100
		limiter.Unlock()
		if over {
			http.Error(w, "rate limit exceeded", http.StatusTooManyRequests)
			return
		}
		next.ServeHTTP(w, r)
	})
}
