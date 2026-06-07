package performance

import (
	"bytes"
	"strconv"
	"strings"
	"sync"
)

// BuilderPool reuses strings.Builder instances for small JSON/log/string assembly.
var BuilderPool = sync.Pool{New: func() any { return &strings.Builder{} }}

// BufferPool reuses byte buffers for streamed text responses and compression helpers.
var BufferPool = sync.Pool{New: func() any { return bytes.NewBuffer(make([]byte, 0, 4096)) }}

func WithBuilder(fn func(*strings.Builder)) string {
	builder := BuilderPool.Get().(*strings.Builder)
	builder.Reset()
	fn(builder)
	out := builder.String()
	builder.Reset()
	BuilderPool.Put(builder)
	return out
}

func AppendInt(dst []byte, value int) []byte {
	return strconv.AppendInt(dst, int64(value), 10)
}

func JoinPath(parts ...string) string {
	return WithBuilder(func(b *strings.Builder) {
		for i, part := range parts {
			if i > 0 && !strings.HasSuffix(b.String(), "/") {
				b.WriteByte('/')
			}
			b.WriteString(strings.Trim(part, "/"))
		}
	})
}
