package db

type Config struct { DatabaseURL string }
func Open(cfg Config) string { return cfg.DatabaseURL }
