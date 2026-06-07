package cache

import (
	"context"
	"time"
)

func Set(ctx context.Context, engine, key, value string, ttl time.Duration) error {
	if err := ctx.Err(); err != nil {
		return err
	}
	memory.Set(Namespace(engine, key), value, ttl)
	return nil
}
func Get(ctx context.Context, engine, key string) (string, error) {
	if err := ctx.Err(); err != nil {
		return "", err
	}
	if value, ok := memory.Get(Namespace(engine, key)); ok {
		return value, nil
	}
	return "", nil
}
