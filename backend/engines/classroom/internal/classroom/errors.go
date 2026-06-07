package classroom

import "errors"

var (
	ErrRoomNotFound       = errors.New("classroom room not found")
	ErrRoomFull           = errors.New("classroom room is full")
	ErrCameraLimitReached = errors.New("classroom camera limit reached")
	ErrNotEnrolled        = errors.New("learner is not enrolled in this class")
	ErrTeacherOnly        = errors.New("teacher-only classroom action")
	ErrInvalidBoardEvent  = errors.New("invalid classroom board event")
	ErrUploadTooLarge     = errors.New("classroom board upload too large")
	ErrReconnectExpired   = errors.New("classroom reconnect window expired")
	ErrMeetingNotStarted  = errors.New("classroom meeting has not started")
)

func ErrorName(err error) string {
	switch err {
	case ErrRoomNotFound:
		return "room_not_found"
	case ErrRoomFull:
		return "room_full"
	case ErrCameraLimitReached:
		return "camera_limit_reached"
	case ErrNotEnrolled:
		return "not_enrolled"
	case ErrTeacherOnly:
		return "teacher_only_action"
	case ErrInvalidBoardEvent:
		return "invalid_board_event"
	case ErrUploadTooLarge:
		return "upload_too_large"
	case ErrReconnectExpired:
		return "reconnect_expired"
	case ErrMeetingNotStarted:
		return "meeting_not_started"
	default:
		return "classroom_error"
	}
}
