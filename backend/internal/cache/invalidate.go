package cache

import "context"

func Invalidate(ctx context.Context, engine, key string) error {
	if err := ctx.Err(); err != nil {
		return err
	}
	memory.Delete(Namespace(engine, key))
	return nil
}
