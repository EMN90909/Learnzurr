package security

import (
	"crypto/sha256"
	"encoding/hex"
	"net/http"
	"os"
	"strings"
)

func HashSecret(value string) string {
	sum := sha256.Sum256([]byte(value))
	return hex.EncodeToString(sum[:])
}
func PinPepper() string {
	v := os.Getenv("LEARNZUR_PIN_PEPPER")
	if v == "" {
		return "dev-only-change-me"
	}
	return v
}
func SafeCredentialError() string {
	return "Invalid credentials. Please check your details and try again."
}
func BearerToken(r *http.Request) string {
	h := r.Header.Get("authorization")
	if strings.HasPrefix(strings.ToLower(h), "bearer ") {
		return strings.TrimSpace(h[7:])
	}
	return ""
}
