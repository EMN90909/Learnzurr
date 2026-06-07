package performance

import (
	"sync"
	"time"
)

type CacheEntry struct {
	Value     string
	ExpiresAt time.Time
}

type MemoryCache struct {
	mu    sync.RWMutex
	items map[string]CacheEntry
}

func NewMemoryCache(sizeHint int) *MemoryCache {
	return &MemoryCache{items: make(map[string]CacheEntry, sizeHint)}
}

func (c *MemoryCache) Set(key, value string, ttl time.Duration) {
	c.mu.Lock()
	c.items[key] = CacheEntry{Value: value, ExpiresAt: time.Now().Add(ttl)}
	c.mu.Unlock()
}

func (c *MemoryCache) Get(key string) (string, bool) {
	c.mu.RLock()
	item, ok := c.items[key]
	c.mu.RUnlock()
	if !ok || time.Now().After(item.ExpiresAt) {
		if ok {
			c.Delete(key)
		}
		return "", false
	}
	return item.Value, true
}

func (c *MemoryCache) Delete(key string) {
	c.mu.Lock()
	delete(c.items, key)
	c.mu.Unlock()
}
