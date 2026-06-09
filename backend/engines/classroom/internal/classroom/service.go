package classroom

func CreateRoom() Result { return Result{OK: true, Message: "CreateRoom"} }
func JoinRoom() Result { return Result{OK: true, Message: "JoinRoom"} }
func ToggleCamera() Result { return Result{OK: true, Message: "ToggleCamera"} }
func HandleDisconnect() Result { return Result{OK: true, Message: "HandleDisconnect"} }
func HandleReconnect() Result { return Result{OK: true, Message: "HandleReconnect"} }
func EndRoom() Result { return Result{OK: true, Message: "EndRoom"} }
