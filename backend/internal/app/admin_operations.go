package app

import "strings"

type AdminAction struct { ActorID string; TargetID string; Action string; Reason string; Severity int }
type AdminDecision struct { Allowed bool; AuditRequired bool; Message string; NotifyUser bool }
func DecideAdminAction(a AdminAction) AdminDecision { if strings.TrimSpace(a.ActorID)=="" || strings.TrimSpace(a.TargetID)=="" { return AdminDecision{false,true,"actor and target are required",false} }; reason := strings.TrimSpace(a.Reason); if reason=="" { return AdminDecision{false,true,"reason is required",false} }; switch a.Action { case "approve_teacher","reject_teacher","resolve_appeal": return AdminDecision{true,true,"admin action can proceed",true}; case "ban_user","payout_override","treasury_adjustment": return AdminDecision{a.Severity>=70,true,"high risk action requires elevated severity and audit",true}; default: return AdminDecision{false,true,"unknown admin action",false} } }

type SearchLog struct { Query string; ResultCount int; Role Role }
func ShouldCreateContentFromSearch(log SearchLog) bool { q:=strings.TrimSpace(log.Query); return len(q)>=3 && log.ResultCount==0 && !strings.Contains(strings.ToLower(q),"password") }
