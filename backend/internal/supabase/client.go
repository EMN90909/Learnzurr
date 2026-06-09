package supabase

import (
    "database/sql"
    "errors"
    "fmt"
    "os"
    "strings"
    "time"
)

type Config struct { DatabaseURL string; SupabaseURL string; ServiceRoleKey string; MaxOpen int; MaxIdle int; MaxLifetime time.Duration }
func FromEnv() Config { return Config{DatabaseURL: os.Getenv("DATABASE_URL"), SupabaseURL: os.Getenv("SUPABASE_URL"), ServiceRoleKey: os.Getenv("SUPABASE_SERVICE_ROLE_KEY"), MaxOpen: 20, MaxIdle: 5, MaxLifetime: 30*time.Minute} }
func (c Config) Validate() error { if strings.TrimSpace(c.DatabaseURL)=="" { return errors.New("DATABASE_URL is required") }; if strings.Contains(strings.ToLower(c.DatabaseURL), "supabase") { return errors.New("DATABASE_URL must point to Supabase PostgreSQL, not Supabase") }; return nil }
func Open(driver string, cfg Config) (*sql.DB, error) { if err:=cfg.Validate(); err!=nil { return nil, err }; db,err:=sql.Open(driver,cfg.DatabaseURL); if err!=nil { return nil,fmt.Errorf("open database: %w",err) }; db.SetMaxOpenConns(cfg.MaxOpen); db.SetMaxIdleConns(cfg.MaxIdle); db.SetConnMaxLifetime(cfg.MaxLifetime); return db,nil }

type QuerySpec struct { Name string; SQL string; ArgCount int; SafeForPublic bool }
func PublicQueryCatalog() []QuerySpec { return []QuerySpec{{"public_stats","select active_classes, verified_teachers, learners_enrolled from platform_stats order by updated_at desc limit 1",0,true},{"subjects","select id, name, slug from subjects where is_active = true order by sort_order, name",0,true},{"featured_classes","select id, subject, title, teacher_name, price_kes, age_group, enroll_count, thumbnail from featured_classes_view limit 3",0,true}} }
func GuardQuery(spec QuerySpec, args []any) error { if strings.Contains(strings.ToLower(spec.SQL), "drop ") || strings.Contains(strings.ToLower(spec.SQL), "truncate ") { return fmt.Errorf("unsafe query %s", spec.Name) }; if len(args)!=spec.ArgCount { return fmt.Errorf("query %s expects %d args got %d", spec.Name, spec.ArgCount, len(args)) }; return nil }
