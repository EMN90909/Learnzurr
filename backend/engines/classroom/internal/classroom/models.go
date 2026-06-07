package classroom

import "time"

const (
	MaxStudents           = 50
	MaxCameras            = 10
	ReconnectGraceSeconds = 180
)

type Health struct {
	Engine    string `json:"engine"`
	Status    string `json:"status"`
	Namespace string `json:"namespace"`
}

type Result struct {
	ID      string `json:"id"`
	Status  string `json:"status"`
	Message string `json:"message,omitempty"`
}

type Room struct {
	ID          string    `json:"id"`
	ClassID     string    `json:"class_id"`
	TeacherID   string    `json:"teacher_id"`
	Status      string    `json:"status"`
	StartedAt   time.Time `json:"started_at"`
	EndedAt     time.Time `json:"ended_at,omitempty"`
	MaxStudents int32     `json:"max_students"`
	MaxCameras  int32     `json:"max_cameras"`
}

type Participant struct {
	ID               string    `json:"id"`
	RoomID           string    `json:"room_id"`
	UserID           string    `json:"user_id"`
	Role             string    `json:"role"`
	JoinedAt         time.Time `json:"joined_at"`
	LeftAt           time.Time `json:"left_at,omitempty"`
	ConnectionStatus string    `json:"connection_status"`
	CameraEnabled    bool      `json:"camera_enabled"`
	MicEnabled       bool      `json:"mic_enabled"`
}

type Attendance struct {
	ID                       string    `json:"id"`
	RoomID                   string    `json:"room_id"`
	ClassID                  string    `json:"class_id"`
	LearnerID                string    `json:"learner_id"`
	JoinedAt                 time.Time `json:"joined_at"`
	LeftAt                   time.Time `json:"left_at,omitempty"`
	TotalPresentSeconds      int32     `json:"total_present_seconds"`
	TotalDisconnectedSeconds int32     `json:"total_disconnected_seconds"`
	Status                   string    `json:"status"`
	FinalizedAt              time.Time `json:"finalized_at,omitempty"`
}

type Meeting struct {
	ID             string    `json:"id"`
	Title          string    `json:"title"`
	Description    string    `json:"description"`
	HostTeacherID  string    `json:"host_teacher_id"`
	ClassID        string    `json:"class_id"`
	ScheduledStart time.Time `json:"scheduled_start"`
	ScheduledEnd   time.Time `json:"scheduled_end"`
	Status         string    `json:"status"`
}

type MeetingParticipant struct {
	ID        string    `json:"id"`
	MeetingID string    `json:"meeting_id"`
	UserID    string    `json:"user_id"`
	Role      string    `json:"role"`
	Status    string    `json:"status"`
	JoinedAt  time.Time `json:"joined_at,omitempty"`
	LeftAt    time.Time `json:"left_at,omitempty"`
}

type Recording struct {
	ID              string `json:"id"`
	RoomID          string `json:"room_id,omitempty"`
	MeetingID       string `json:"meeting_id,omitempty"`
	FileID          string `json:"file_id"`
	StorageURL      string `json:"storage_url"`
	DurationSeconds int32  `json:"duration_seconds"`
	Status          string `json:"status"`
}

type BoardState struct {
	ID        string    `json:"id"`
	RoomID    string    `json:"room_id"`
	StateJSON jsonRaw   `json:"state_json"`
	Version   int32     `json:"version"`
	UpdatedBy string    `json:"updated_by"`
	UpdatedAt time.Time `json:"updated_at"`
}

type jsonRaw = map[string]any

type BoardEvent struct {
	EventID        string    `json:"event_id"`
	RoomID         string    `json:"room_id"`
	ActorUserID    string    `json:"actor_user_id"`
	ActorRole      string    `json:"actor_role"`
	EventType      string    `json:"event_type"`
	Timestamp      time.Time `json:"timestamp"`
	Payload        jsonRaw   `json:"payload"`
	SequenceNumber int32     `json:"sequence_number"`
}

type BoardStroke struct {
	StrokeID  string     `json:"stroke_id"`
	Points    [][2]int32 `json:"points"`
	Color     string     `json:"color"`
	Width     int32      `json:"width"`
	Tool      string     `json:"tool"`
	CreatedBy string     `json:"created_by"`
	CreatedAt time.Time  `json:"created_at"`
}

type BoardText struct {
	TextID    string    `json:"text_id"`
	X         int32     `json:"x"`
	Y         int32     `json:"y"`
	Value     string    `json:"value"`
	FontSize  int32     `json:"font_size"`
	Color     string    `json:"color"`
	Width     int32     `json:"width"`
	Height    int32     `json:"height"`
	CreatedBy string    `json:"created_by"`
	UpdatedAt time.Time `json:"updated_at"`
}

type BoardImage struct {
	ImageID    string    `json:"image_id"`
	FileID     string    `json:"file_id"`
	URL        string    `json:"url"`
	X          int32     `json:"x"`
	Y          int32     `json:"y"`
	Width      int32     `json:"width"`
	Height     int32     `json:"height"`
	Rotation   int32     `json:"rotation"`
	UploadedBy string    `json:"uploaded_by"`
	CreatedAt  time.Time `json:"created_at"`
}

type CameraEvent struct {
	ID              string    `json:"id"`
	RoomID          string    `json:"room_id"`
	UserID          string    `json:"user_id"`
	EventType       string    `json:"event_type"`
	StartedAt       time.Time `json:"started_at"`
	EndedAt         time.Time `json:"ended_at,omitempty"`
	DurationSeconds int32     `json:"duration_seconds"`
}

type HandRaise struct {
	ID        string    `json:"id"`
	RoomID    string    `json:"room_id"`
	LearnerID string    `json:"learner_id"`
	Status    string    `json:"status"`
	RaisedAt  time.Time `json:"raised_at"`
	LoweredAt time.Time `json:"lowered_at,omitempty"`
	HandledBy string    `json:"handled_by,omitempty"`
}

type ChatMessage struct {
	ID               string    `json:"id"`
	RoomID           string    `json:"room_id"`
	SenderID         string    `json:"sender_id"`
	Message          string    `json:"message"`
	ModerationStatus string    `json:"moderation_status"`
	FlagID           string    `json:"flag_id,omitempty"`
	CreatedAt        time.Time `json:"created_at"`
}

type ReconnectLog struct {
	ID              string    `json:"id"`
	RoomID          string    `json:"room_id"`
	UserID          string    `json:"user_id"`
	DisconnectedAt  time.Time `json:"disconnected_at"`
	ReconnectedAt   time.Time `json:"reconnected_at,omitempty"`
	DurationSeconds int32     `json:"duration_seconds"`
	Reason          string    `json:"reason"`
}

type ClassroomAnnouncement struct {
	ID        string    `json:"id"`
	RoomID    string    `json:"room_id"`
	TeacherID string    `json:"teacher_id"`
	Title     string    `json:"title"`
	Body      string    `json:"body"`
	CreatedAt time.Time `json:"created_at"`
}

type ClassroomAuditLog struct {
	ID          string    `json:"id"`
	ActorUserID string    `json:"actor_user_id"`
	RoomID      string    `json:"room_id"`
	Action      string    `json:"action"`
	TargetType  string    `json:"target_type"`
	TargetID    string    `json:"target_id"`
	Metadata    jsonRaw   `json:"metadata_json"`
	CreatedAt   time.Time `json:"created_at"`
}
