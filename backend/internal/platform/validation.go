package platform

import (
 "regexp"
 "strings"
)

var emailRe = regexp.MustCompile(`^[^@\s]+@[^@\s]+\.[^@\s]+$`)
var phoneRe = regexp.MustCompile(`^(\+254|254|0)?[17][0-9]{8}$`)

func IsEmail(v string) bool { return emailRe.MatchString(strings.TrimSpace(v)) }
func IsKenyanPhone(v string) bool { return phoneRe.MatchString(strings.ReplaceAll(strings.TrimSpace(v), " ", "")) }
func RoleHome(role Role) string { switch role { case RoleAdmin: return "/admin/dashboard"; case RoleTeacher: return "/teacher/dashboard"; case RoleParent: return "/parent/dashboard"; case RoleLearner: return "/learner/dashboard"; default: return "/login" } }
func AgeGroup(age int) string { if age <= 10 { return "junior" }; if age <= 14 { return "middle" }; return "senior" }
func SafeDisplayName(name, fallback string) string { n := strings.TrimSpace(name); if n == "" { return fallback }; return strings.NewReplacer("<","",">","", "\x00", "").Replace(n) }
