package security

import (
	"crypto/hmac"
	"crypto/rand"
	"crypto/sha256"
	"encoding/base64"
	"errors"
	"os"
	"strings"
	"unicode"
)

const passwordIterations = 120000

func ValidatePasswordComplexity(password string) error {
	if len([]rune(password)) < 8 {
		return errors.New("password must have at least 8 characters")
	}
	hasLetter := false
	hasNumber := false
	for _, r := range password {
		if unicode.IsLetter(r) {
			hasLetter = true
		}
		if unicode.IsDigit(r) {
			hasNumber = true
		}
	}
	if !hasLetter || !hasNumber {
		return errors.New("password must include at least one letter and one number")
	}
	return nil
}

func HashPassword(password string) (string, error) {
	if err := ValidatePasswordComplexity(password); err != nil {
		return "", err
	}
	return hashSecretWithSalt([]byte(password))
}

func VerifyPassword(password, encoded string) bool {
	return verifySecretWithSalt([]byte(password), encoded)
}

func pinPepper() ([]byte, error) {
	pepper := strings.TrimSpace(os.Getenv("PIN_PEPPER"))
	if len(pepper) < 16 {
		return nil, errors.New("PIN_PEPPER must be configured with at least 16 characters")
	}
	return []byte(pepper), nil
}

func HashPIN(pin string) (string, error) {
	if len(pin) != 6 {
		return "", errors.New("PIN must be 6 digits")
	}
	for _, r := range pin {
		if r < '0' || r > '9' {
			return "", errors.New("PIN must contain digits only")
		}
	}
	pepper, err := pinPepper()
	if err != nil {
		return "", err
	}
	mac := hmac.New(sha256.New, pepper)
	mac.Write([]byte(pin))
	return hashSecretWithSalt(mac.Sum(nil))
}

func VerifyPIN(pin, encoded string) bool {
	pepper, err := pinPepper()
	if err != nil || len(pin) != 6 {
		return false
	}
	mac := hmac.New(sha256.New, pepper)
	mac.Write([]byte(pin))
	return verifySecretWithSalt(mac.Sum(nil), encoded)
}

func hashSecretWithSalt(secret []byte) (string, error) {
	salt := make([]byte, 16)
	if _, err := rand.Read(salt); err != nil {
		return "", err
	}
	derived := pbkdf2SHA256(secret, salt, passwordIterations, 32)
	return "pbkdf2_sha256$" + base64.RawURLEncoding.EncodeToString(salt) + "$" + base64.RawURLEncoding.EncodeToString(derived), nil
}

func verifySecretWithSalt(secret []byte, encoded string) bool {
	parts := strings.Split(encoded, "$")
	if len(parts) != 3 || parts[0] != "pbkdf2_sha256" {
		return false
	}
	salt, err := base64.RawURLEncoding.DecodeString(parts[1])
	if err != nil {
		return false
	}
	expected, err := base64.RawURLEncoding.DecodeString(parts[2])
	if err != nil {
		return false
	}
	actual := pbkdf2SHA256(secret, salt, passwordIterations, len(expected))
	return hmac.Equal(actual, expected)
}

func pbkdf2SHA256(password, salt []byte, iterations, keyLen int) []byte {
	hLen := 32
	blocks := (keyLen + hLen - 1) / hLen
	out := make([]byte, 0, blocks*hLen)
	for block := 1; block <= blocks; block++ {
		mac := hmac.New(sha256.New, password)
		mac.Write(salt)
		mac.Write([]byte{byte(block >> 24), byte(block >> 16), byte(block >> 8), byte(block)})
		u := mac.Sum(nil)
		t := append([]byte(nil), u...)
		for i := 1; i < iterations; i++ {
			mac = hmac.New(sha256.New, password)
			mac.Write(u)
			u = mac.Sum(nil)
			for j := range t {
				t[j] ^= u[j]
			}
		}
		out = append(out, t...)
	}
	return out[:keyLen]
}
