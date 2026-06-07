package classroom

import "time"

func RedisKeys(roomID string) []string {
	return []string{
		"classroom:room:" + roomID + ":state",
		"classroom:room:" + roomID + ":participants",
		"classroom:room:" + roomID + ":cameras",
		"classroom:room:" + roomID + ":board:state",
		"classroom:room:" + roomID + ":board:events",
		"classroom:room:" + roomID + ":handraise",
		"classroom:room:" + roomID + ":chat:recent",
		"classroom:config",
	}
}

func CacheTTL() time.Duration { return 3 * time.Minute }

func ReconnectKey(roomID, userID string) string {
	return "classroom:room:" + safe(roomID) + ":reconnect:" + safe(userID)
}
