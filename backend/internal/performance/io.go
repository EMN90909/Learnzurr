package performance

import (
	"bufio"
	"context"
	"io"
	"net/http"
	"time"
)

const MaxRequestBodyBytes int64 = 10 * 1024 * 1024

func LimitedBody(w http.ResponseWriter, r *http.Request) io.Reader {
	return http.MaxBytesReader(w, r.Body, MaxRequestBodyBytes)
}

func NewFastReader(r io.Reader) *bufio.Reader {
	return bufio.NewReaderSize(r, 32*1024)
}

func WithTimeout(parent context.Context, d time.Duration) (context.Context, context.CancelFunc) {
	return context.WithTimeout(parent, d)
}
