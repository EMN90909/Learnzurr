package lms

func CreateQuiz() Result { return Result{OK: true, Message: "CreateQuiz"} }
func SubmitQuiz() Result { return Result{OK: true, Message: "SubmitQuiz"} }
func AutoGrade() Result { return Result{OK: true, Message: "AutoGrade"} }
func GradeAssignment() Result { return Result{OK: true, Message: "GradeAssignment"} }
func GetGradebook() Result { return Result{OK: true, Message: "GetGradebook"} }
