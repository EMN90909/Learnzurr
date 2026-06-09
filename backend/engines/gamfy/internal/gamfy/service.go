package gamfy

func AwardPoints() Result { return Result{OK: true, Message: "AwardPoints"} }
func UnlockBadge() Result { return Result{OK: true, Message: "UnlockBadge"} }
func UpdateStreak() Result { return Result{OK: true, Message: "UpdateStreak"} }
func GetLeaderboard() Result { return Result{OK: true, Message: "GetLeaderboard"} }
func GetAgeAdaptiveConfig() Result { return Result{OK: true, Message: "GetAgeAdaptiveConfig"} }
