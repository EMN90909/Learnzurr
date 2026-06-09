package workflows

import "fmt"

type Treasury struct { Teacher int; Platform int; Rewards int; Tax int }
func (t Treasury) Total() int { return t.Teacher + t.Platform + t.Rewards + t.Tax }
func ApplySplit(amount int, teacherPct int) (Treasury, error) { if amount<=0 { return Treasury{}, fmt.Errorf("amount must be positive") }; if teacherPct<50 || teacherPct>95 { return Treasury{}, fmt.Errorf("teacher percentage outside safe policy") }; teacher:=amount*teacherPct/100; platform:=amount*10/100; rewards:=amount*5/100; tax:=amount-teacher-platform-rewards; if tax<0 { return Treasury{}, fmt.Errorf("split exceeds gross amount") }; return Treasury{Teacher:teacher,Platform:platform,Rewards:rewards,Tax:tax}, nil }

type ReconciliationLine struct { Expected int; Actual int; Reference string }
type ReconciliationReport struct { Balanced bool; Difference int; Failed []string }
func Reconcile(lines []ReconciliationLine) ReconciliationReport { diff:=0; failed:=[]string{}; for _,l:=range lines { d:=l.Actual-l.Expected; diff += d; if d!=0 { failed=append(failed,l.Reference) } }; return ReconciliationReport{Balanced:diff==0,Difference:diff,Failed:failed} }
