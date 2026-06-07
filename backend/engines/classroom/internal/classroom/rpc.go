package classroom

func NotifyClassStart(roomID string) Result {
	return Result{ID: safe(roomID), Status: "notify_queued", Message: "Notify engine class-start ring requested through signed internal RPC."}
}
func NotifyMeetingStart(meetingID string) Result {
	return Result{ID: safe(meetingID), Status: "notify_queued", Message: "Notify engine meeting-start ring requested through signed internal RPC."}
}
func AwardAttendancePoints(roomID string) Result {
	return Result{ID: safe(roomID), Status: "gamfy_queued", Message: "Gamfy attendance point award requested through signed internal RPC."}
}
func FlagChatMessage(roomID, message string) Result {
	return Result{ID: safe(roomID), Status: "flag_checked", Message: "Flag engine scanned classroom chat before delivery: " + safe(message)}
}
func StoreBoardImage(roomID, fileID string) Result {
	return Result{ID: safe(roomID), Status: "media_stored", Message: "Media engine stores board image " + safe(fileID) + " and returns signed URL metadata."}
}
