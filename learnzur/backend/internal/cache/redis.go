package cache

import "os"

type Config struct{ URL string }

func FromEnv() Config                     { return Config{URL: os.Getenv("REDIS_URL")} }
func Namespace(engine, key string) string { return "learnzur:" + engine + ":" + key }
