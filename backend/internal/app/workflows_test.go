package app

import (
 "testing"
 "time"
)

func TestPlanEnrollment(t *testing.T) { plan := PlanEnrollment(EnrollmentWorkflowInput{ParentID:"parent-1", Learner:LearnerProfile{ID:"learner-1",Age:12}, Class:ClassOffer{ID:"class-1",TeacherID:"teacher-1",PriceKES:1000,AgeMin:8,AgeMax:14,Capacity:20,Enrolled:3,Verified:true,Moderated:true}, MpesaPhone:"0712345678", Now:time.Now()}); if !plan.Allowed { t.Fatalf("expected allowed: %#v", plan) }; if len(plan.PaymentSplits)!=4 { t.Fatalf("expected four splits") }; if plan.IdempotencyKey=="" { t.Fatalf("missing idempotency key") } }
func TestTeacherVerification(t *testing.T) { d := DecideTeacherVerification(TeacherVerificationInput{TeacherID:"t1",CertificateHash:"abc",Subjects:[]string{"Math"},County:"Nairobi",YearsExperience:3}); if !d.Approved { t.Fatalf("expected approval: %#v", d) } }
func TestTimetableConflict(t *testing.T) { conflicts := DetectTimetableConflicts([]TimetableSlot{{Day:"Mon",StartMinute:540,DurationMinute:60,ClassID:"a"},{Day:"Mon",StartMinute:570,DurationMinute:30,ClassID:"b"}}); if len(conflicts)!=1 { t.Fatalf("expected conflict") } }
