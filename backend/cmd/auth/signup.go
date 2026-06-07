package auth

import (
	"encoding/json"
	"learnzur/backend/internal/security"
	"net/http"
	"regexp"
	"strings"
)

type SignupRequest struct {
	AccountType        string   `json:"accountType"`
	Email              string   `json:"email"`
	Password           string   `json:"password"`
	Name               string   `json:"name"`
	Phone              string   `json:"phone"`
	County             string   `json:"county"`
	MpesaPhone         string   `json:"mpesaPhone"`
	OTP                string   `json:"otp"`
	OrganizationName   string   `json:"organizationName"`
	OrganizationType   string   `json:"organizationType"`
	RegistrationNumber string   `json:"registrationNumber"`
	Subjects           []string `json:"subjects"`
	AgeGroups          []string `json:"ageGroups"`
	CertificateName    string   `json:"certificateName"`
	HCaptchaToken      string   `json:"hcaptchaToken"`
}

var emailPattern = regexp.MustCompile(`^[^@\s]+@[^@\s]+\.[^@\s]+$`)
var kenyaPhonePattern = regexp.MustCompile(`^(?:\+254|254|0)?[17]\d{8}$`)

func validateSignupBasics(req SignupRequest, requirePhone bool) error {
	if !emailPattern.MatchString(strings.ToLower(strings.TrimSpace(req.Email))) {
		return http.ErrNoCookie
	}
	if err := security.ValidatePasswordComplexity(req.Password); err != nil {
		return err
	}
	if err := security.ValidateTextInput(req.Name); err != nil {
		return err
	}
	if requirePhone && !kenyaPhonePattern.MatchString(strings.ReplaceAll(strings.TrimSpace(req.Phone), " ", "")) {
		return http.ErrNoCookie
	}
	return nil
}

func normalizeAdultKind(value string) string {
	kind := strings.ToLower(strings.TrimSpace(value))
	if kind == "organization" || kind == "school" || kind == "ngo" || kind == "tuition_centre" {
		return "organization"
	}
	return "teacher"
}

func SignupParent(w http.ResponseWriter, r *http.Request) {
	var req SignupRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "invalid request", http.StatusBadRequest)
		return
	}
	if !hcaptchaOK(r, req.HCaptchaToken) {
		http.Error(w, "security check failed", http.StatusForbidden)
		return
	}
	if err := validateSignupBasics(req, true); err != nil {
		http.Error(w, "invalid signup details", http.StatusBadRequest)
		return
	}
	if _, err := security.HashPassword(req.Password); err != nil {
		http.Error(w, "invalid signup details", http.StatusBadRequest)
		return
	}
	writeJSON(w, map[string]any{"status": "created", "role": "parent", "next": "/parent/dashboard"})
}

func SignupTeacher(w http.ResponseWriter, r *http.Request) {
	var req SignupRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "invalid request", http.StatusBadRequest)
		return
	}
	if !hcaptchaOK(r, req.HCaptchaToken) {
		http.Error(w, "security check failed", http.StatusForbidden)
		return
	}
	if err := validateSignupBasics(req, true); err != nil {
		http.Error(w, "invalid signup details", http.StatusBadRequest)
		return
	}
	if err := security.ValidateArrayLength(req.Subjects); err != nil {
		http.Error(w, "too many subjects", http.StatusBadRequest)
		return
	}
	if err := security.ValidateArrayLength(req.AgeGroups); err != nil {
		http.Error(w, "too many age groups", http.StatusBadRequest)
		return
	}
	if _, err := security.HashPassword(req.Password); err != nil {
		http.Error(w, "invalid signup details", http.StatusBadRequest)
		return
	}
	kind := normalizeAdultKind(req.AccountType)
	response := map[string]any{
		"status":       "pending_admin_approval",
		"role":         "teacher",
		"accountType":  kind,
		"approvalFlow": "teacher_or_organization_review",
		"next":         "/login",
	}
	if kind == "organization" {
		response["organizationName"] = strings.TrimSpace(security.Sanitize(req.OrganizationName))
		response["organizationType"] = strings.TrimSpace(security.Sanitize(req.OrganizationType))
	}
	writeJSON(w, response)
}

func SignupOrganization(w http.ResponseWriter, r *http.Request) {
	var req SignupRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "invalid request", http.StatusBadRequest)
		return
	}
	if !hcaptchaOK(r, req.HCaptchaToken) {
		http.Error(w, "security check failed", http.StatusForbidden)
		return
	}
	req.AccountType = "organization"
	if err := validateSignupBasics(req, true); err != nil {
		http.Error(w, "invalid signup details", http.StatusBadRequest)
		return
	}
	if _, err := security.HashPassword(req.Password); err != nil {
		http.Error(w, "invalid signup details", http.StatusBadRequest)
		return
	}
	writeJSON(w, map[string]any{
		"status":             "pending_admin_approval",
		"role":               "teacher",
		"accountType":        "organization",
		"organizationName":   strings.TrimSpace(security.Sanitize(req.OrganizationName)),
		"organizationType":   strings.TrimSpace(security.Sanitize(req.OrganizationType)),
		"registrationNumber": strings.TrimSpace(security.Sanitize(req.RegistrationNumber)),
		"approvalFlow":       "teacher_or_organization_review",
		"next":               "/login",
	})
}

func CreateChild(w http.ResponseWriter, r *http.Request) {
	var req struct {
		FullName string `json:"fullName"`
		Username string `json:"username"`
		PIN      string `json:"pin"`
	}
	_ = json.NewDecoder(r.Body).Decode(&req)
	if req.FullName == "" || security.ValidateTextInput(req.FullName) != nil || len(req.PIN) != 6 {
		http.Error(w, "invalid child details", http.StatusBadRequest)
		return
	}
	writeJSON(w, map[string]any{"status": "created", "role": "learner"})
}
