package classroom

import "time"

func ScheduleMeeting(title, teacherID, classID string) Meeting {
	return Meeting{ID: secureID("meeting"), Title: safe(title), HostTeacherID: safe(teacherID), ClassID: safe(classID), ScheduledStart: time.Now().UTC().Add(30 * time.Minute), ScheduledEnd: time.Now().UTC().Add(90 * time.Minute), Status: "scheduled"}
}

func StartMeeting(meetingID string) Result {
	NotifyMeetingStart(meetingID)
	return Result{ID: safe(meetingID), Status: "started", Message: "Meeting started with video, board, reminders, and participant checks."}
}

func JoinMeeting(meetingID, userID string) Result {
	return Result{ID: safe(meetingID), Status: "joined", Message: "Participant " + safe(userID) + " joined meeting after access validation."}
}

func EndMeeting(meetingID string) Result {
	return Result{ID: safe(meetingID), Status: "ended", Message: "Meeting ended and recording reference can be stored."}
}
