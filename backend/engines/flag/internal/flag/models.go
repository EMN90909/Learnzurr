package flag

import "time"

type Health struct {
	Engine    string `json:"engine"`
	Status    string `json:"status"`
	Namespace string `json:"namespace"`
}

type Result struct {
	ID     string `json:"id"`
	Status string `json:"status"`
}

type ChatScanRequest struct {
	RoomID  string `json:"room_id"`
	UserID  string `json:"user_id"`
	Message string `json:"message"`
}

type ChatScanResult struct {
	SandboxID string    `json:"sandbox_id"`
	Allowed   bool      `json:"allowed"`
	Banned    bool      `json:"banned"`
	Severity  string    `json:"severity"`
	Provider  string    `json:"provider"`
	Reason    string    `json:"reason"`
	CreatedAt time.Time `json:"created_at"`
}
