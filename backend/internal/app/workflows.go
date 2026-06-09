package app

import (
    "crypto/sha256"
    "encoding/hex"
    "fmt"
    "sort"
    "strings"
    "time"
)

type EnrollmentWorkflowInput struct { ParentID string; Learner LearnerProfile; Class ClassOffer; MpesaPhone string; Now time.Time }
type WorkflowStep struct { Key string; Status string; Message string }
type EnrollmentWorkflowPlan struct { Allowed bool; IdempotencyKey string; Steps []WorkflowStep; PaymentSplits []Split; Errors []string }

func PlanEnrollment(input EnrollmentWorkflowInput) EnrollmentWorkflowPlan {
    plan := EnrollmentWorkflowPlan{Steps: []WorkflowStep{}}
    decision := ValidateClassForLearner(input.Class, input.Learner)
    if !decision.Allowed { plan.Errors = append(plan.Errors, decision.Reason); plan.Steps = append(plan.Steps, WorkflowStep{"eligibility","blocked",decision.Reason}); return plan }
    phone, err := NormalizeKenyanPhone(input.MpesaPhone); if err != nil { plan.Errors = append(plan.Errors, err.Error()); plan.Steps = append(plan.Steps, WorkflowStep{"payment_phone","blocked",err.Error()}); return plan }
    splits, err := ComputeTransactionSplit(input.Class.PriceKES, DefaultSplitConfig()); if err != nil { plan.Errors = append(plan.Errors, err.Error()); return plan }
    plan.PaymentSplits = splits
    plan.Allowed = true
    plan.IdempotencyKey = StableKey("enroll", input.ParentID, input.Learner.ID, input.Class.ID, phone, fmt.Sprint(input.Class.PriceKES))
    plan.Steps = append(plan.Steps, WorkflowStep{"eligibility","passed","Learner can join this class"}, WorkflowStep{"payment","ready","M-Pesa STK Push can be initiated"}, WorkflowStep{"enrollment","queued","Enrollment finalizes after Daraja callback confirms payment"}, WorkflowStep{"notify","queued","Parent, learner and teacher receive confirmation"})
    return plan
}

func StableKey(parts ...string) string { h:=sha256.New(); for _,p := range parts { h.Write([]byte(strings.TrimSpace(strings.ToLower(p)))); h.Write([]byte{0}) }; return hex.EncodeToString(h.Sum(nil))[:32] }

type TeacherVerificationInput struct { TeacherID string; CertificateHash string; Subjects []string; County string; YearsExperience int; DuplicateHash bool }
type VerificationDecision struct { Approved bool; Status string; Reasons []string; RequiredActions []string }
func DecideTeacherVerification(in TeacherVerificationInput) VerificationDecision { reasons:=[]string{}; actions:=[]string{}; if strings.TrimSpace(in.TeacherID)=="" { reasons=append(reasons,"missing teacher id") }; if strings.TrimSpace(in.CertificateHash)=="" { reasons=append(reasons,"certificate hash is required"); actions=append(actions,"upload certificate") }; if in.DuplicateHash { reasons=append(reasons,"certificate was uploaded by another account"); actions=append(actions,"manual document review") }; if len(in.Subjects)==0 { reasons=append(reasons,"at least one subject is required"); actions=append(actions,"add teaching subjects") }; if strings.TrimSpace(in.County)=="" { reasons=append(reasons,"county is required") }; if len(reasons)>0 { return VerificationDecision{false,"needs_review",reasons,actions} }; if in.YearsExperience < 1 { return VerificationDecision{false,"probation",[]string{"new teacher requires first class review"},[]string{"admin approves first class manually"}} }; return VerificationDecision{true,"approved",[]string{"teacher profile is complete and certificate is unique"},nil} }

type TimetableSlot struct { Day string; StartMinute int; DurationMinute int; ClassID string }
func DetectTimetableConflicts(slots []TimetableSlot) []string { byDay:=map[string][]TimetableSlot{}; for _,s := range slots { byDay[strings.ToLower(s.Day)] = append(byDay[strings.ToLower(s.Day)], s) }; conflicts:=[]string{}; for day, items := range byDay { sort.Slice(items, func(i,j int) bool { return items[i].StartMinute < items[j].StartMinute }); for i:=1; i<len(items); i++ { prev:=items[i-1]; cur:=items[i]; if prev.StartMinute+prev.DurationMinute > cur.StartMinute { conflicts=append(conflicts, fmt.Sprintf("%s conflict between %s and %s", day, prev.ClassID, cur.ClassID)) } } }; return conflicts }
