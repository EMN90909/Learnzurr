package cache

import (
	"context"
	"learnzur/backend/internal/performance"
	"strings"
)

var memory = performance.NewMemoryCache(512)

func Ping(ctx context.Context) error { return ctx.Err() }

func Namespace(engine, key string) string {
	return performance.WithBuilder(func(b *strings.Builder) {
		b.WriteString("learnzur:")
		b.WriteString(engine)
		b.WriteByte(':')
		b.WriteString(key)
	})
}
