package lanmat

import "time"

type EngineJob struct {
	ID       string         `json:"id"`
	Type     string         `json:"type"`
	Payload  map[string]any `json:"payload"`
	QueuedAt time.Time      `json:"queuedAt"`
}

func QueueNames() []string {
	return []string{"learnzur:lanmat:jobs", "learnzur:lanmat:dead_letter", "learnzur:lanmat:audit"}
}

func HandleJob(job EngineJob) Result {
	status := "processed"
	if job.ID == "" || job.Type == "" {
		status = "rejected"
	}
	return Result{ID: job.ID, Status: status}
}
