package db

import "os"

type Config struct{ SupabaseURL, ServiceRoleKey, DatabaseURL string }

func FromEnv() Config {
	return Config{SupabaseURL: os.Getenv("SUPABASE_URL"), ServiceRoleKey: os.Getenv("SUPABASE_SERVICE_ROLE_KEY"), DatabaseURL: os.Getenv("DATABASE_URL")}
}
