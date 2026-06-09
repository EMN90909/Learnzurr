package notify

func SendPush() Result { return Result{OK: true, Message: "SendPush"} }
func SendEmail() Result { return Result{OK: true, Message: "SendEmail"} }
func ScheduleReminder() Result { return Result{OK: true, Message: "ScheduleReminder"} }
func Subscribe() Result { return Result{OK: true, Message: "Subscribe"} }
