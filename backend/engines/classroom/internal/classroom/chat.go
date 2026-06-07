package classroom

import (
	"strings"
	"time"
)

func SendChat(roomID, senderID, message string) ChatMessage {
	text := strings.TrimSpace(message)
	status := "allowed"
	if text == "" {
		status = "blocked_empty"
	}
	if strings.Contains(strings.ToLower(text), "<script") {
		status = "blocked_flag"
	}
	msg := ChatMessage{ID: secureID("chat"), RoomID: safe(roomID), SenderID: safe(senderID), Message: text, ModerationStatus: status, CreatedAt: time.Now().UTC()}
	if status == "allowed" {
		Repository{}.SaveChatMessage(msg)
	}
	return msg
}

func ChatHistory(roomID string) []ChatMessage { return Repository{}.ChatHistory(roomID) }

func ParentMonitorChat(roomID, parentID string) []ChatMessage {
	_ = parentID
	return ChatHistory(roomID)
}
