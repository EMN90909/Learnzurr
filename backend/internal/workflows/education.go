package workflows

import "math"

type ScoreComponent struct { Name string; Score float64; Weight float64 }
type GradeSummary struct { Total float64; Letter string; Components []ScoreComponent; NeedsSupport bool }
func ComputeWeightedGrade(components []ScoreComponent) GradeSummary { totalWeight:=0.0; total:=0.0; out:=make([]ScoreComponent,0,len(components)); for _,c:= range components { if c.Weight<=0 { continue }; if c.Score<0 { c.Score=0 }; if c.Score>100 { c.Score=100 }; totalWeight += c.Weight; total += c.Score*c.Weight; out=append(out,c) }; if totalWeight==0 { return GradeSummary{Total:0, Letter:"N/A", Components:out, NeedsSupport:true} }; pct:=math.Round(total/totalWeight*10)/10; letter:="E"; switch { case pct>=80: letter="A"; case pct>=70: letter="B"; case pct>=60: letter="C"; case pct>=50: letter="D" }; return GradeSummary{Total:pct, Letter:letter, Components:out, NeedsSupport:pct<60} }

type AttendanceMark struct { SessionID string; MinutesPresent int; SessionMinutes int }
func AttendancePercent(marks []AttendanceMark) int { total:=0; present:=0; for _,m:=range marks { if m.SessionMinutes<=0 { continue }; total += m.SessionMinutes; if m.MinutesPresent<0 { m.MinutesPresent=0 }; if m.MinutesPresent>m.SessionMinutes { m.MinutesPresent=m.SessionMinutes }; present += m.MinutesPresent }; if total==0 { return 0 }; return int(math.Round(float64(present)/float64(total)*100)) }

type SupportSignal struct { LearnerID string; GradePercent float64; AttendancePercent int; MissingTasks int; ChatFlags int }
func SupportPriority(s SupportSignal) string { score:=0; if s.GradePercent<50 { score+=35 } else if s.GradePercent<60 { score+=20 }; if s.AttendancePercent<65 { score+=25 }; if s.MissingTasks>=3 { score+=20 }; if s.ChatFlags>0 { score+=25 }; switch { case score>=60: return "urgent"; case score>=30: return "watch"; default: return "stable" } }
