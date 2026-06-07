package security

import (
	"encoding/json"
	"log"
	"time"
)

type AuditEntry struct {
	At       time.Time      `json:"at"`
	Actor    string         `json:"actor"`
	Action   string         `json:"action"`
	Metadata map[string]any `json:"metadata"`
}

func Audit(actor, action string, metadata map[string]any) {
	safe := map[string]any{}
	for k, v := range metadata {
		if s, ok := v.(string); ok {
			safe[k] = MaskSensitiveLog(s)
		} else {
			safe[k] = v
		}
	}
	encoded, err := json.Marshal(AuditEntry{At: time.Now().UTC(), Actor: actor, Action: action, Metadata: safe})
	if err != nil {
		log.Printf("audit_encode_error=%v", err)
		return
	}
	log.Printf("audit=%s", encoded)
}
