package platform

import "time"

type Role string
const (
    RoleAdmin Role = "admin"
    RoleTeacher Role = "teacher"
    RoleParent Role = "parent"
    RoleLearner Role = "learner"
)

type User struct { ID string; Email string; Phone string; Role Role; FullName string; County string; Status string; CreatedAt time.Time }
type ChildProfile struct { UserID string; Username string; Age int; AgeGroup string; ParentID string; PinHash string }
type TeacherProfile struct { UserID string; Subjects []string; Counties []string; Verified bool; CertificateURL string; Rating float64 }
type Class struct { ID string; Title string; Subject string; TeacherID string; PriceKES int; AgeMin int; AgeMax int; Enrolled int; Capacity int; Status string }
type Payment struct { ID string; UserID string; AmountKES int; Phone string; Purpose string; Status string; ProviderRef string; CreatedAt time.Time }
type Notification struct { ID string; UserID string; Kind string; Title string; Body string; Read bool; CreatedAt time.Time }
type APIError struct { Code string `json:"code"`; Message string `json:"message"`; Details any `json:"details,omitempty"` }
