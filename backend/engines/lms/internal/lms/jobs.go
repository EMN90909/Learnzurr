package lms

import "time"

type EngineJob struct {
	ID       string         `json:"id"`
	Type     string         `json:"type"`
	Payload  map[string]any `json:"payload"`
	QueuedAt time.Time      `json:"queuedAt"`
}

func QueueNames() []string {
	return []string{"learnzur:lms:jobs", "learnzur:lms:dead_letter", "learnzur:lms:audit"}
}

func HandleJob(job EngineJob) Result {
	status := "processed"
	if job.ID == "" || job.Type == "" {
		status = "rejected"
	}
	return Result{ID: job.ID, Status: status}
}
