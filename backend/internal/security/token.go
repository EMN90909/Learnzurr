package security

import (
	"crypto/hmac"
	"crypto/rand"
	"crypto/sha256"
	"encoding/base64"
	"encoding/json"
	"errors"
	"os"
	"strings"
	"time"
)

const AccessTokenTTL = 15 * time.Minute
const RefreshTokenTTL = 7 * 24 * time.Hour

type TokenClaims struct {
	UserID    string `json:"uid"`
	Role      string `json:"role"`
	IssuedAt  int64  `json:"iat"`
	ExpiresAt int64  `json:"exp"`
	Issuer    string `json:"iss"`
	Audience  string `json:"aud"`
}

func jwtSecret() ([]byte, error) {
	secret := strings.TrimSpace(os.Getenv("LEARNZUR_JWT_SECRET"))
	if len(secret) >= 32 {
		return []byte(secret), nil
	}
	return nil, errors.New("LEARNZUR_JWT_SECRET must be at least 32 characters")
}

func SignAccessToken(userID, role string) (string, error) {
	return signToken(userID, role, AccessTokenTTL)
}

func SignRefreshToken(userID, role string) (string, error) {
	return signToken(userID, role, RefreshTokenTTL)
}

func signToken(userID, role string, ttl time.Duration) (string, error) {
	if err := ValidateURLParam(userID); err != nil {
		return "", err
	}
	if role == "" || len(role) > 32 || scriptLike.MatchString(role) {
		return "", errors.New("invalid role")
	}
	now := time.Now().UTC()
	claims := TokenClaims{UserID: userID, Role: role, IssuedAt: now.Unix(), ExpiresAt: now.Add(ttl).Unix(), Issuer: "learnzur-api", Audience: "learnzur-web"}
	payload, err := json.Marshal(claims)
	if err != nil {
		return "", err
	}
	encodedPayload := base64.RawURLEncoding.EncodeToString(payload)
	secret, err := jwtSecret()
	if err != nil {
		return "", err
	}
	mac := hmac.New(sha256.New, secret)
	mac.Write([]byte(encodedPayload))
	sig := base64.RawURLEncoding.EncodeToString(mac.Sum(nil))
	return encodedPayload + "." + sig, nil
}

func VerifyAccessToken(raw string) (*TokenClaims, error) {
	parts := strings.Split(raw, ".")
	if len(parts) != 2 || parts[0] == "" || parts[1] == "" {
		return nil, errors.New("invalid token format")
	}
	secret, err := jwtSecret()
	if err != nil {
		return nil, err
	}
	mac := hmac.New(sha256.New, secret)
	mac.Write([]byte(parts[0]))
	expected := mac.Sum(nil)
	actual, err := base64.RawURLEncoding.DecodeString(parts[1])
	if err != nil || !hmac.Equal(actual, expected) {
		return nil, errors.New("invalid token signature")
	}
	payload, err := base64.RawURLEncoding.DecodeString(parts[0])
	if err != nil {
		return nil, err
	}
	claims := &TokenClaims{}
	if err := json.Unmarshal(payload, claims); err != nil {
		return nil, err
	}
	if claims.UserID == "" || claims.Role == "" || claims.Issuer != "learnzur-api" || claims.Audience != "learnzur-web" {
		return nil, errors.New("invalid token claims")
	}
	now := time.Now().UTC().Unix()
	if claims.ExpiresAt <= now {
		return nil, errors.New("token expired")
	}
	if claims.IssuedAt > now+60 {
		return nil, errors.New("token issued in the future")
	}
	return claims, nil
}

func RandomDigits(n int) (string, error) {
	if n <= 0 || n > 12 {
		return "", errors.New("invalid digit length")
	}
	buf := make([]byte, n)
	if _, err := rand.Read(buf); err != nil {
		return "", err
	}
	out := make([]byte, n)
	for i, b := range buf {
		out[i] = byte('0' + (b % 10))
	}
	return string(out), nil
}
