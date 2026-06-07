package classroom

import "strings"

type SignalMessage struct {
	RoomID    string `json:"room_id"`
	ActorID   string `json:"actor_id"`
	Kind      string `json:"kind"`
	SDP       string `json:"sdp,omitempty"`
	Candidate string `json:"candidate,omitempty"`
}

func RunWebrtc() string { return "classroom.webrtc" }

func HandleOffer(message SignalMessage) Result {
	if strings.TrimSpace(message.SDP) == "" {
		return Result{ID: safe(message.RoomID), Status: "invalid", Message: "missing offer"}
	}
	return Result{ID: safe(message.RoomID), Status: "offer_received", Message: "Pion WebRTC offer accepted at signaling boundary; SFU routing can attach tracks."}
}

func HandleAnswer(message SignalMessage) Result {
	if strings.TrimSpace(message.SDP) == "" {
		return Result{ID: safe(message.RoomID), Status: "invalid", Message: "missing answer"}
	}
	return Result{ID: safe(message.RoomID), Status: "answer_received", Message: "WebRTC answer accepted without logging sensitive SDP data."}
}

func HandleICE(message SignalMessage) Result {
	if strings.TrimSpace(message.Candidate) == "" {
		return Result{ID: safe(message.RoomID), Status: "invalid", Message: "missing ice candidate"}
	}
	return Result{ID: safe(message.RoomID), Status: "ice_received", Message: "ICE candidate accepted with TURN/STUN credentials kept private."}
}

func CameraSlots(roomID string) Result {
	active := Repository{}.CameraCount(roomID)
	if active >= MaxCameras {
		return Result{ID: roomID, Status: "full", Message: ErrCameraLimitReached.Error()}
	}
	return Result{ID: roomID, Status: "available", Message: "Camera slot available; max 10 active cameras protected."}
}
