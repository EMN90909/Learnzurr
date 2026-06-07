package security

import "strings"

func LooksFraudulent(reference string, amount int64) bool {
	ref := strings.TrimSpace(reference)
	if ref == "" || amount <= 0 {
		return true
	}
	if len(ref) < 6 || len(ref) > 80 {
		return true
	}
	return ValidateURLParam(strings.ReplaceAll(ref, "-", "_")) != nil
}
