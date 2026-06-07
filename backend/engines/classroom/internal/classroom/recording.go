package classroom

func RecordingMetadata(id string) Recording {
	return Recording{ID: safe(id), RoomID: "room-active", FileID: "media-file", StorageURL: "signed-url-required", DurationSeconds: 3600, Status: "available_to_authorized_users"}
}

func RecordingSignedURL(id, actorID string) Result {
	return Result{ID: safe(id), Status: "signed_url_ready", Message: "Recording access authorized for " + safe(actorID) + " and returned through a signed URL boundary."}
}
