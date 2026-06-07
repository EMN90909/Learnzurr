package notify

import "time"

type SpeedProfile struct {
	Engine    string        `json:"engine"`
	CacheTTL  time.Duration `json:"cacheTtl"`
	BatchSize int           `json:"batchSize"`
}

func SpeedRules() []string {
	rules := make([]string, 0, 50)
	rules = append(rules, "Use strings.Builder for generated keys and compact payload strings.")
	rules = append(rules, "Pre-allocate slices for leaderboard, search, queue and grade result sets.")
	rules = append(rules, "Use sync.Pool for reusable buffers during JSON, media and job processing.")
	rules = append(rules, "Avoid reflection by keeping typed engine models and repository parameters.")
	rules = append(rules, "Batch database writes inside transactions for rewards, grades, payouts and notifications.")
	rules = append(rules, "Use bufio.Reader for large uploads, sandbox output and media files.")
	rules = append(rules, "Stream responses through io.Writer for exports and sandbox logs.")
	rules = append(rules, "Cache hot reads in Redis and local maps using engine namespaces.")
	rules = append(rules, "Use json.RawMessage for provider callbacks or payloads not fully needed.")
	rules = append(rules, "Minimize struct size for hot models using bounded int32 counters where safe.")
	rules = append(rules, "Use http.ServeMux route boundaries through cmd/api.")
	rules = append(rules, "Support HTTP/2 through Nginx/TLS and standard Go server settings.")
	rules = append(rules, "Compress text API responses with gzip.")
	rules = append(rules, "Set read, write, idle and request timeouts.")
	rules = append(rules, "Reuse TCP connections for Daraja, AI providers and media services.")
	rules = append(rules, "Skip logs for health endpoints.")
	rules = append(rules, "Reuse DB connections through configured pools.")
	rules = append(rules, "Keep /health endpoint fast and dependency-light.")
	rules = append(rules, "Pass context.Context through long-running operations.")
	rules = append(rules, "Limit request bodies to 10MB unless an engine has an explicit smaller bound.")
	rules = append(rules, "Use const for limits and status values.")
	rules = append(rules, "Keep helpers inline-friendly and small.")
	rules = append(rules, "Avoid closures in tight loops and job dispatch hot paths.")
	rules = append(rules, "Use strconv for numeric conversion in route parameters.")
	rules = append(rules, "Pre-compile regex validators once.")
	rules = append(rules, "Use time.Since for duration measurements.")
	rules = append(rules, "Avoid defer inside loops when cleaning many files/jobs.")
	rules = append(rules, "Use bytes.Buffer for large data assembly.")
	rules = append(rules, "Keep imports minimal.")
	rules = append(rules, "Use build tags for optional heavy features in production builds.")
	rules = append(rules, "Use cursor pagination for all public lists.")
	rules = append(rules, "Use idempotency keys to deduplicate async jobs.")
	rules = append(rules, "Use Redis Streams for async job fan-out.")
	rules = append(rules, "Cache negative lookups briefly to protect the database.")
	rules = append(rules, "Batch notification delivery.")
	rules = append(rules, "Use compact response DTOs for mobile users.")
	rules = append(rules, "Move non-critical work into workers.")
	rules = append(rules, "Use request coalescing for popular Explore queries.")
	rules = append(rules, "Use signed URLs instead of proxying large files through API memory.")
	rules = append(rules, "Keep engine health checks independent from database latency.")
	rules = append(rules, "notify specific speed rule 1: keep engine work bounded, cacheable and queue-friendly.")
	rules = append(rules, "notify specific speed rule 2: keep engine work bounded, cacheable and queue-friendly.")
	rules = append(rules, "notify specific speed rule 3: keep engine work bounded, cacheable and queue-friendly.")
	rules = append(rules, "notify specific speed rule 4: keep engine work bounded, cacheable and queue-friendly.")
	rules = append(rules, "notify specific speed rule 5: keep engine work bounded, cacheable and queue-friendly.")
	rules = append(rules, "notify specific speed rule 6: keep engine work bounded, cacheable and queue-friendly.")
	rules = append(rules, "notify specific speed rule 7: keep engine work bounded, cacheable and queue-friendly.")
	rules = append(rules, "notify specific speed rule 8: keep engine work bounded, cacheable and queue-friendly.")
	rules = append(rules, "notify specific speed rule 9: keep engine work bounded, cacheable and queue-friendly.")
	rules = append(rules, "notify specific speed rule 10: keep engine work bounded, cacheable and queue-friendly.")
	return rules
}

func DefaultSpeedProfile() SpeedProfile {
	return SpeedProfile{Engine: "notify", CacheTTL: 5 * time.Minute, BatchSize: 100}
}
