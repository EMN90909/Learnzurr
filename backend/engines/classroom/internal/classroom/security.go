package classroom

import (
	"regexp"
	"strings"
	"time"

	shared "learnzur/backend/internal/security"
)

const EngineName = "classroom"
const ProtectedSurface = "live rooms, WebRTC, board, chat, meetings, attendance, recordings"
const maxEnginePayloadFields = 7
const maxEngineTextLength = 100
const maxBoardImageMB = 10

var safeIdentifierPattern = regexp.MustCompile(`^[A-Za-z0-9_-]+$`)

type SecurityDecision struct {
	Allowed bool   `json:"allowed"`
	Reason  string `json:"reason"`
}
type SecurityContext struct {
	ActorID        string
	ActorRole      string
	ResourceOwner  string
	Action         string
	IdempotencyKey string
	RPCCaller      string
	RPCTokenExpiry time.Time
	Payload        map[string]any
}

func EngineMeaning() string {
	return EngineName + " = live classes, WebRTC, board, attendance, meetings"
}

func SecurityRules() []string {
	return []string{
		"1. Verify user authentication before joining room.",
		"2. Check learner enrollment before joining class.",
		"3. Check teacher owns class before starting room.",
		"4. Check teacher owns class before ending room.",
		"5. Check participant permission before joining meeting.",
		"6. Generate signed room join tokens.",
		"7. Expire room join tokens quickly.",
		"8. Prevent token reuse after room ends.",
		"9. Validate room status before join.",
		"10. Prevent banned or restricted users from joining.",
		"11. Enforce maximum 50 students per room.",
		"12. Enforce maximum 10 active cameras.",
		"13. Give teacher camera priority.",
		"14. Prevent learner from forcing camera on without permission.",
		"15. Prevent learner from controlling teacher-only tools.",
		"16. Validate WebSocket origin.",
		"17. Require auth on WebSocket upgrade.",
		"18. Rate-limit WebSocket messages.",
		"19. Validate WebRTC signaling payloads.",
		"20. Never expose private TURN/STUN credentials.",
		"21. Do not log sensitive WebRTC credentials.",
		"22. Validate board event type.",
		"23. Validate board event actor permissions.",
		"24. Allow teacher board control by default.",
		"25. Keep students board view-only by default.",
		"26. Require teacher permission for student board control.",
		"27. Validate board stroke payload size.",
		"28. Validate board text payload size.",
		"29. Sanitize typed board text.",
		"30. Validate uploaded board image MIME type.",
		"31. Limit uploaded board image size.",
		"32. Store board images with signed/private URLs.",
		"33. Prevent board image path traversal.",
		"34. Prevent board event spam/flooding.",
		"35. Prevent unauthorized board clear.",
		"36. Prevent unauthorized board erase.",
		"37. Ignore duplicate board events by event_id.",
		"38. Prevent out-of-order board corruption using sequence numbers.",
		"39. Send classroom chat through Flag before delivery.",
		"40. Block unsafe chat messages.",
		"41. Rate-limit chat messages.",
		"42. Rate-limit hand raises.",
		"43. Rate-limit reconnect attempts.",
		"44. Prevent learner from marking own attendance.",
		"45. Calculate attendance server-side only.",
		"46. Track disconnect/reconnect honestly.",
		"47. Protect recordings with authorization and signed URLs.",
		"48. Sign RPC calls to Notify, Gamfy, Flag, and Media.",
		"49. Audit room start, room end, camera changes, board clears, image uploads, and participant removals.",
		"50. Store immutable classroom audit logs.",
	}
}

func ValidateRequest(actorID string, payload map[string]any) SecurityDecision {
	return ValidateSecurityContext(SecurityContext{ActorID: actorID, Payload: payload})
}

func ValidateSecurityContext(ctx SecurityContext) SecurityDecision {
	if strings.TrimSpace(ctx.ActorID) == "" {
		return SecurityDecision{Allowed: false, Reason: "actor is required"}
	}
	if shared.IsRestrictedUser(ctx.ActorID) {
		return SecurityDecision{Allowed: false, Reason: "actor is restricted"}
	}
	if ctx.Payload == nil {
		return SecurityDecision{Allowed: false, Reason: "payload is required"}
	}
	if len(ctx.Payload) > maxEnginePayloadFields {
		return SecurityDecision{Allowed: false, Reason: "payload has too many fields"}
	}
	for key, value := range ctx.Payload {
		if !safeIdentifierPattern.MatchString(key) {
			return SecurityDecision{Allowed: false, Reason: "payload key is unsafe"}
		}
		if text, ok := value.(string); ok {
			if len(text) > maxEngineTextLength {
				return SecurityDecision{Allowed: false, Reason: "text is too long"}
			}
			if containsUnsafeMarkup(text) {
				return SecurityDecision{Allowed: false, Reason: "html is not allowed"}
			}
		}
	}
	return SecurityDecision{Allowed: true, Reason: "accepted"}
}

func ValidateBoardPermission(role, eventType string) SecurityDecision {
	if role == "teacher" {
		return SecurityDecision{Allowed: true, Reason: "teacher controls board"}
	}
	if eventType == "board.sync.request" {
		return SecurityDecision{Allowed: true, Reason: "learner can request sync"}
	}
	return SecurityDecision{Allowed: false, Reason: "students are board view-only unless teacher grants permission"}
}

func ValidateCameraSlot(activeCameras int) SecurityDecision {
	if activeCameras >= MaxCameras {
		return SecurityDecision{Allowed: false, Reason: "camera limit reached"}
	}
	return SecurityDecision{Allowed: true, Reason: "camera slot available"}
}

func containsUnsafeMarkup(text string) bool {
	lower := strings.ToLower(text)
	return strings.Contains(lower, "<script") || strings.Contains(lower, "</script") || strings.Contains(text, "<") || strings.Contains(text, ">")
}
