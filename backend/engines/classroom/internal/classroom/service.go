package classroom

import (
	"crypto/rand"
	"encoding/hex"
	"strings"
	"time"
)

type Service struct{ Repo Repository }

func NewService() Service { return Service{Repo: Repository{}} }

func (s Service) Health() Health {
	return Health{Engine: "classroom", Status: "ok", Namespace: s.Repo.Namespace()}
}

func (s Service) CreateRoom(classID, teacherID string) Result {
	roomID := secureID("room")
	room := Room{ID: roomID, ClassID: safe(classID), TeacherID: safe(teacherID), Status: "active", StartedAt: time.Now().UTC(), MaxStudents: MaxStudents, MaxCameras: MaxCameras}
	s.Repo.SaveRoom(room)
	NotifyClassStart(roomID)
	return Result{ID: roomID, Status: "active", Message: "Room created, Notify ring queued, Redis live state ready."}
}

func (s Service) Room(roomID string) (Room, bool) { return s.Repo.GetRoom(roomID) }

func (s Service) JoinRoom(roomID, userID, role string) Result {
	if strings.TrimSpace(roomID) == "" {
		roomID = "room-active"
	}
	p := Participant{ID: secureID("participant"), RoomID: roomID, UserID: safe(userID), Role: safe(role), JoinedAt: time.Now().UTC(), ConnectionStatus: "connected", MicEnabled: true}
	participants := s.Repo.Participants(roomID)
	if len(participants) >= MaxStudents+1 {
		return Result{ID: roomID, Status: "blocked", Message: ErrRoomFull.Error()}
	}
	s.Repo.AddParticipant(roomID, p)
	TrackJoin(roomID, userID)
	return Result{ID: roomID, Status: "joined", Message: "Participant joined; attendance and board sync started."}
}

func (s Service) LeaveRoom(roomID, userID string) Result {
	TrackLeave(roomID, userID)
	return Result{ID: safe(roomID), Status: "left", Message: "Participant leave recorded and reconnect timer started if needed."}
}

func (s Service) EndRoom(roomID string) Result {
	FinalizeAttendance(roomID)
	PersistBoardState(roomID)
	AwardAttendancePoints(roomID)
	return Result{ID: safe(roomID), Status: "ended", Message: "Room ended; attendance finalized, board saved, Redis state ready for TTL cleanup."}
}

func (s Service) Participants(roomID string) []Participant { return s.Repo.Participants(roomID) }

func secureID(prefix string) string {
	b := make([]byte, 6)
	if _, err := rand.Read(b); err != nil {
		return prefix + "_fallback"
	}
	return prefix + "_" + hex.EncodeToString(b)
}

func safe(v string) string {
	cleaned := strings.TrimSpace(v)
	if cleaned == "" {
		return "classroom"
	}
	return cleaned
}
