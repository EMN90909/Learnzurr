package middleware

import (
	"compress/gzip"
	"net/http"
	"strings"
	"sync"
)

var gzipPool = sync.Pool{New: func() any { return gzip.NewWriter(nil) }}

type gzipWriter struct {
	http.ResponseWriter
	writer *gzip.Writer
}

func (g gzipWriter) Write(b []byte) (int, error) { return g.writer.Write(b) }

func Compress(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if !strings.Contains(r.Header.Get("Accept-Encoding"), "gzip") || r.URL.Path == "/api/health" {
			next.ServeHTTP(w, r)
			return
		}
		w.Header().Set("Content-Encoding", "gzip")
		gz := gzipPool.Get().(*gzip.Writer)
		gz.Reset(w)
		next.ServeHTTP(gzipWriter{ResponseWriter: w, writer: gz}, r)
		_ = gz.Close()
		gzipPool.Put(gz)
	})
}
