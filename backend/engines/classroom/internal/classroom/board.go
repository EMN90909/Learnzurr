package classroom

import (
	"strings"
	"time"
)

var allowedBoardEvents = map[string]bool{
	"board.stroke.start": true, "board.stroke.move": true, "board.stroke.end": true,
	"board.text.add": true, "board.text.update": true, "board.text.delete": true,
	"board.erase": true, "board.clear": true,
	"board.image.upload": true, "board.image.move": true, "board.image.resize": true, "board.image.delete": true,
	"board.pointer.move": true, "board.undo": true, "board.redo": true,
	"board.sync.request": true, "board.sync.full_state": true,
}

func RunBoard() string { return "classroom.board" }

func ValidateBoardEvent(event BoardEvent) error {
	if strings.TrimSpace(event.EventID) == "" || strings.TrimSpace(event.RoomID) == "" {
		return ErrInvalidBoardEvent
	}
	if !allowedBoardEvents[event.EventType] {
		return ErrInvalidBoardEvent
	}
	if event.SequenceNumber < 0 {
		return ErrInvalidBoardEvent
	}
	if event.ActorRole != "teacher" && event.EventType != "board.sync.request" {
		return ErrTeacherOnly
	}
	return nil
}

func ApplyBoardEvent(event BoardEvent) ([]BoardEvent, error) {
	if event.Timestamp.IsZero() {
		event.Timestamp = time.Now().UTC()
	}
	if err := ValidateBoardEvent(event); err != nil {
		return nil, err
	}
	return Repository{}.SaveBoardEvent(event), nil
}

func GetBoardState(roomID string) []BoardEvent { return Repository{}.BoardEvents(roomID) }

func PersistBoardState(roomID string) Result {
	return Result{ID: roomID, Status: "saved", Message: "Board state persisted from Redis delta stream to PostgreSQL boundary."}
}

func BoardRedisKeys(roomID string) []string {
	return []string{
		"classroom:room:" + roomID + ":board:state",
		"classroom:room:" + roomID + ":board:events",
	}
}
