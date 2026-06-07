package classroom

func JobTypes() []string {
	return []string{"classroom.class_reminder", "classroom.meeting_reminder", "classroom.room_cleanup", "classroom.attendance_finalize", "classroom.reconnect_timeout", "classroom.recording_process", "classroom.board_persist"}
}

func DispatchJob(kind, id string) Result {
	return Result{ID: safe(id), Status: "queued", Message: "Classroom job " + safe(kind) + " dispatched through Redis Streams worker boundary."}
}
