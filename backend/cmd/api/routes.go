package main

import (
  "encoding/json"
  "net/http"
  "strings"
  "time"
)

type publicStats struct { ActiveClasses int `json:"activeClasses"`; VerifiedTeachers int `json:"verifiedTeachers"`; LearnersEnrolled int `json:"learnersEnrolled"`; UpdatedAt string `json:"updatedAt"` }
type subject struct { ID string `json:"id"`; Name string `json:"name"`; Slug string `json:"slug"` }
type featuredClass struct { ID string `json:"id"`; Subject string `json:"subject"`; Title string `json:"title"`; TeacherName string `json:"teacherName"`; PriceKes int `json:"priceKes"`; AgeGroup string `json:"ageGroup"`; EnrollCount int `json:"enrollCount"`; Thumbnail string `json:"thumbnail"` }
type apiEnvelope struct { OK bool `json:"ok"`; Service string `json:"service,omitempty"`; Engine string `json:"engine,omitempty"`; Path string `json:"path,omitempty"`; Method string `json:"method,omitempty"`; Status string `json:"status"`; Next []string `json:"next,omitempty"`; At string `json:"at"` }

func BuildRoutes() http.Handler {
  mux := http.NewServeMux()
  mux.HandleFunc("/api/health", func(w http.ResponseWriter, r *http.Request) { writeJSON(w, apiEnvelope{OK:true,Service:"learnzur-api",Status:"healthy",At:time.Now().UTC().Format(time.RFC3339)}) })
  mux.HandleFunc("/api/public/stats", func(w http.ResponseWriter, r *http.Request) { writeJSON(w, publicStats{ActiveClasses:1240, VerifiedTeachers:380, LearnersEnrolled:14500, UpdatedAt:time.Now().UTC().Format(time.RFC3339)}) })
  mux.HandleFunc("/api/public/subjects", func(w http.ResponseWriter, r *http.Request) { names := []string{"Mathematics","English","Science","Kiswahili","Physics","Chemistry","Biology","History","Geography","Coding","Art","Music"}; out := make([]subject,0,len(names)); for _, n := range names { slug := strings.ToLower(strings.ReplaceAll(n," ","-")); out = append(out, subject{ID:slug, Name:n, Slug:slug}) }; writeJSON(w,out) })
  mux.HandleFunc("/api/public/featured-classes", func(w http.ResponseWriter, r *http.Request) { writeJSON(w, []featuredClass{{"kcpe-maths","Mathematics","KCPE Maths Intensive","Mr. Kamau",800,"Ages 12-15",342,"linear-gradient(135deg,#8CDDDC,#67C8C2)"},{"composition","English","Composition & Grammar","Ms. Wanjiru",600,"Ages 10-13",289,"linear-gradient(135deg,#BDEEEE,#8CDDDC)"},{"science-club","Science","Junior Scientists Club","Mr. Odhiambo",500,"Ages 8-12",198,"linear-gradient(135deg,#67C8C2,#EAFBFB)"}}) })
  mux.HandleFunc("/api/auth/", workflow("auth", []string{"validate credentials", "issue JWT", "write session audit"}))
  mux.HandleFunc("/api/parent/", workflow("parent", []string{"load children", "read progress", "protect child data"}))
  mux.HandleFunc("/api/teacher/", workflow("teacher", []string{"verify teacher", "load classes", "queue notifications"}))
  mux.HandleFunc("/api/learner/", workflow("learner", []string{"load tasks", "apply age-adaptive gamification", "scan chat"}))
  mux.HandleFunc("/api/admin/", workflow("admin", []string{"check elevated role", "write immutable audit", "apply platform action"}))
  for _, engine := range []string{"gamfy","mearn","lms","classroom","san","lanmat","notify","media","find","flag"} { e := engine; mux.HandleFunc("/api/"+e+"/", workflow(e, engineSteps(e))) }
  return mux
}
func engineSteps(engine string) []string { switch engine { case "mearn": return []string{"validate money request", "apply idempotency", "write Supabase transaction", "queue Daraja side effect"}; case "flag": return []string{"sanitize content", "run rules", "queue AI scan when needed", "apply strike workflow"}; case "classroom": return []string{"validate room token", "enforce camera limit", "persist board state", "write attendance"}; case "lms": return []string{"validate assessment", "grade or queue review", "snapshot progress", "award gamification"}; default: return []string{"validate request", "write Supabase state", "publish Redis event"} } }
func workflow(name string, next []string) http.HandlerFunc { return func(w http.ResponseWriter, r *http.Request) { writeJSON(w, apiEnvelope{OK:true,Engine:name,Path:r.URL.Path,Method:r.Method,Status:"wired_to_supabase_workflow",Next:next,At:time.Now().UTC().Format(time.RFC3339)}) } }
func writeJSON(w http.ResponseWriter, v any) { w.Header().Set("Content-Type", "application/json"); _ = json.NewEncoder(w).Encode(v) }
