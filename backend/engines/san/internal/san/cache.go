package san

import "time"

type CacheEntry struct {
	Key   string        `json:"key"`
	Value string        `json:"value"`
	TTL   time.Duration `json:"ttl"`
}

func CacheNamespace() string { return "learnzur:san" }

func CacheKey(parts ...string) string {
	key := CacheNamespace()
	for _, part := range parts {
		if part != "" {
			key += ":" + part
		}
	}
	return key
}

func DefaultCacheTTL() time.Duration { return 5 * time.Minute }
