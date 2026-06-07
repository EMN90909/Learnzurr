package media

import "time"

type EngineJob struct {
	ID       string         `json:"id"`
	Type     string         `json:"type"`
	Payload  map[string]any `json:"payload"`
	QueuedAt time.Time      `json:"queuedAt"`
}

func QueueNames() []string {
	return []string{"learnzur:media:jobs", "learnzur:media:dead_letter", "learnzur:media:audit"}
}

func HandleJob(job EngineJob) Result {
	status := "processed"
	if job.ID == "" || job.Type == "" {
		status = "rejected"
	}
	return Result{ID: job.ID, Status: status}
}
