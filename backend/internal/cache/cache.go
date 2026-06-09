package cache

import "time"
func Set(key string, value []byte, ttl time.Duration) error { return nil }
func Get(key string) ([]byte, error) { return nil, nil }
func Delete(key string) error { return nil }
