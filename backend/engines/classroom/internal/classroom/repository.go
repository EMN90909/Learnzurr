package classroom

import (
	"sync"
	"time"
)

type Repository struct{}

var live = struct {
	sync.RWMutex
	rooms        map[string]Room
	participants map[string][]Participant
	board        map[string][]BoardEvent
	chat         map[string][]ChatMessage
	hand         map[string][]HandRaise
	attendance   map[string][]Attendance
}{
	rooms:        map[string]Room{},
	participants: map[string][]Participant{},
	board:        map[string][]BoardEvent{},
	chat:         map[string][]ChatMessage{},
	hand:         map[string][]HandRaise{},
	attendance:   map[string][]Attendance{},
}

func (Repository) Namespace() string { return "learnzur:classroom" }

func (Repository) SaveRoom(room Room) Room {
	live.Lock()
	defer live.Unlock()
	live.rooms[room.ID] = room
	return room
}

func (Repository) GetRoom(roomID string) (Room, bool) {
	live.RLock()
	defer live.RUnlock()
	room, ok := live.rooms[roomID]
	return room, ok
}

func (Repository) AddParticipant(roomID string, p Participant) []Participant {
	live.Lock()
	defer live.Unlock()
	live.participants[roomID] = append(live.participants[roomID], p)
	return append([]Participant(nil), live.participants[roomID]...)
}

func (Repository) Participants(roomID string) []Participant {
	live.RLock()
	defer live.RUnlock()
	return append([]Participant(nil), live.participants[roomID]...)
}

func (Repository) CameraCount(roomID string) int {
	live.RLock()
	defer live.RUnlock()
	count := 0
	for _, p := range live.participants[roomID] {
		if p.CameraEnabled {
			count++
		}
	}
	return count
}

func (Repository) SaveBoardEvent(event BoardEvent) []BoardEvent {
	live.Lock()
	defer live.Unlock()
	events := live.board[event.RoomID]
	for _, existing := range events {
		if existing.EventID == event.EventID {
			return append([]BoardEvent(nil), events...)
		}
	}
	live.board[event.RoomID] = append(events, event)
	return append([]BoardEvent(nil), live.board[event.RoomID]...)
}

func (Repository) BoardEvents(roomID string) []BoardEvent {
	live.RLock()
	defer live.RUnlock()
	return append([]BoardEvent(nil), live.board[roomID]...)
}

func (Repository) SaveChatMessage(msg ChatMessage) []ChatMessage {
	live.Lock()
	defer live.Unlock()
	live.chat[msg.RoomID] = append(live.chat[msg.RoomID], msg)
	return append([]ChatMessage(nil), live.chat[msg.RoomID]...)
}

func (Repository) ChatHistory(roomID string) []ChatMessage {
	live.RLock()
	defer live.RUnlock()
	return append([]ChatMessage(nil), live.chat[roomID]...)
}

func (Repository) RaiseHand(item HandRaise) []HandRaise {
	live.Lock()
	defer live.Unlock()
	live.hand[item.RoomID] = append(live.hand[item.RoomID], item)
	return append([]HandRaise(nil), live.hand[item.RoomID]...)
}

func (Repository) HandQueue(roomID string) []HandRaise {
	live.RLock()
	defer live.RUnlock()
	return append([]HandRaise(nil), live.hand[roomID]...)
}

func (Repository) SaveAttendance(roomID string, attendance Attendance) []Attendance {
	live.Lock()
	defer live.Unlock()
	attendance.FinalizedAt = time.Now().UTC()
	live.attendance[roomID] = append(live.attendance[roomID], attendance)
	return append([]Attendance(nil), live.attendance[roomID]...)
}

func (Repository) Attendance(roomID string) []Attendance {
	live.RLock()
	defer live.RUnlock()
	return append([]Attendance(nil), live.attendance[roomID]...)
}
