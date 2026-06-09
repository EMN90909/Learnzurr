package workflows

import (
 "crypto/sha256"
 "encoding/hex"
 "fmt"
 "sort"
 "strings"
 "time"
)

type Actor struct { ID string; Role string; County string; Verified bool }
type Resource struct { ID string; OwnerID string; Kind string; Visibility string; ChildFacing bool; Status string }
type AccessDecision struct { Allowed bool; Reason string; Scopes []string; Audit bool }
func DecideAccess(actor Actor, resource Resource, action string) AccessDecision { if actor.ID=="" { return AccessDecision{false,"missing actor",nil,true} }; if resource.ID=="" { return AccessDecision{false,"missing resource",nil,true} }; if actor.Role=="admin" { return AccessDecision{true,"admin access",[]string{"read","write","moderate","audit"},true} }; if actor.ID==resource.OwnerID { return AccessDecision{true,"owner access",[]string{"read","write"}, action!="read"} }; if resource.Visibility=="public" && action=="read" { return AccessDecision{true,"public read",[]string{"read"},false} }; if resource.ChildFacing && action=="write" && !actor.Verified { return AccessDecision{false,"unverified actor cannot write child-facing content",nil,true} }; return AccessDecision{false,"role does not allow this action",nil,true} }

type AuditRecord struct { ActorID string; Action string; Target string; Reason string; Risk int; At time.Time }
func AuditKey(a AuditRecord) string { h:=sha256.Sum256([]byte(strings.Join([]string{a.ActorID,a.Action,a.Target,a.Reason,a.At.UTC().Format("2006-01-02T15:04")},"|"))); return hex.EncodeToString(h[:])[:40] }

type QueueJob struct { Stream string; Type string; Key string; Payload map[string]string; RunAfter time.Time; Attempts int }
func BuildQueueJob(engine, action, key string, payload map[string]string, delay time.Duration) QueueJob { if payload==nil { payload=map[string]string{} }; return QueueJob{Stream:fmt.Sprintf("learnzur.%s.stream", strings.ToLower(engine)), Type:fmt.Sprintf("%s.%s", strings.ToLower(engine), strings.ToLower(action)), Key:key, Payload:payload, RunAfter:time.Now().UTC().Add(delay), Attempts:0} }

type ReviewItem struct { ID string; Severity int; CreatedAt time.Time; Kind string; County string }
func SortReviewQueue(items []ReviewItem) []ReviewItem { out:=append([]ReviewItem(nil), items...); sort.SliceStable(out, func(i,j int) bool { if out[i].Severity==out[j].Severity { return out[i].CreatedAt.Before(out[j].CreatedAt) }; return out[i].Severity>out[j].Severity }); return out }
