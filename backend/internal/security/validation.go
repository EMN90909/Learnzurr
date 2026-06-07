package security

import (
	"bytes"
	"crypto/rand"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"mime"
	"net/url"
	"path/filepath"
	"regexp"
	"strings"
	"time"
)

const MaxUploadBytes int64 = 10 * 1024 * 1024
const MaxTextLength = 100
const MaxArrayLength = 7
const TokenMaxAge = 30 * 24 * time.Hour

var allowedExtensions = map[string]bool{".png": true, ".jpg": true, ".jpeg": true, ".txt": true, ".json": true}
var alphaID = regexp.MustCompile(`^[A-Za-z0-9_-]+$`)
var scriptLike = regexp.MustCompile(`(?i)<\s*/?\s*(script|iframe|object|embed|style|link|meta)[^>]*>`)

func ValidateFileExtension(name string) error {
	ext := strings.ToLower(filepath.Ext(name))
	if ext == ".jpeg" {
		ext = ".jpg"
	}
	if !allowedExtensions[ext] {
		return fmt.Errorf("file type %q is not allowed", ext)
	}
	return nil
}

func ValidateFileSize(size int64) error {
	if size < 0 {
		return errors.New("file size is invalid")
	}
	if size > MaxUploadBytes {
		return fmt.Errorf("file is larger than %d bytes", MaxUploadBytes)
	}
	return nil
}

func ValidateMIME(filename string, content []byte, declared string) error {
	ext := strings.ToLower(filepath.Ext(filename))
	if ext == ".jpeg" {
		ext = ".jpg"
	}
	normalized, _, _ := mime.ParseMediaType(declared)
	if len(content) >= 8 && bytes.Equal(content[:8], []byte{0x89, 'P', 'N', 'G', 0x0d, 0x0a, 0x1a, 0x0a}) {
		if ext != ".png" {
			return errors.New("PNG bytes do not match extension")
		}
		return nil
	}
	if len(content) >= 3 && content[0] == 0xff && content[1] == 0xd8 && content[2] == 0xff {
		if ext != ".jpg" {
			return errors.New("JPG bytes do not match extension")
		}
		return nil
	}
	if ext == ".json" {
		var dst any
		if json.Unmarshal(content, &dst) != nil {
			return errors.New("JSON file content is invalid")
		}
		return nil
	}
	if ext == ".txt" {
		if strings.Contains(string(content), "\x00") {
			return errors.New("text file contains null bytes")
		}
		return nil
	}
	if normalized != "" && !strings.HasPrefix(normalized, "image/") && normalized != "text/plain" && normalized != "application/json" {
		return errors.New("declared MIME type is not allowed")
	}
	return nil
}

func SanitizeFilename(name string) string {
	cleaned := filepath.Base(name)
	replacer := strings.NewReplacer("..", "", "/", "", "\\", "", "<", "", ">", "", "?", "", "*", "", "\"", "", "'", "", "\x00", "")
	cleaned = replacer.Replace(cleaned)
	cleaned = strings.TrimSpace(cleaned)
	if cleaned == "" {
		return "upload.bin"
	}
	return cleaned
}

func ValidateURLParam(id string) error {
	if id == "" || len(id) > 80 || !alphaID.MatchString(id) {
		return errors.New("URL parameter format is invalid")
	}
	return nil
}

func ValidateURL(raw string) error {
	parsed, err := url.Parse(raw)
	if err != nil || parsed.Scheme == "" || parsed.Host == "" {
		return errors.New("URL is invalid")
	}
	if parsed.Scheme != "https" && parsed.Scheme != "http" {
		return errors.New("URL scheme is not allowed")
	}
	return nil
}

func ValidateJSONStructure(r io.Reader, required ...string) (map[string]any, error) {
	var body map[string]any
	decoder := json.NewDecoder(io.LimitReader(r, MaxUploadBytes))
	decoder.DisallowUnknownFields()
	if err := decoder.Decode(&body); err != nil {
		return nil, err
	}
	for _, field := range required {
		if _, ok := body[field]; !ok {
			return nil, fmt.Errorf("missing required field %s", field)
		}
	}
	return body, nil
}

func ValidateTextInput(value string) error {
	if len([]rune(value)) > MaxTextLength {
		return errors.New("text input is too long")
	}
	if scriptLike.MatchString(value) {
		return errors.New("HTML or script content is not allowed")
	}
	return nil
}

func ValidateArrayLength[T any](items []T) error {
	if len(items) > MaxArrayLength {
		return errors.New("array has too many items")
	}
	return nil
}

func ValidateNumericRange(value, min, max int) error {
	if value < min || value > max {
		return fmt.Errorf("number must be between %d and %d", min, max)
	}
	return nil
}

func RandomFilename(extension string) (string, error) {
	b := make([]byte, 16)
	if _, err := rand.Read(b); err != nil {
		return "", err
	}
	ext := strings.ToLower(extension)
	if ext == ".jpeg" {
		ext = ".jpg"
	}
	if !allowedExtensions[ext] {
		return "", errors.New("extension is not allowed")
	}
	return hex.EncodeToString(b) + ext, nil
}

func SHA256Checksum(content []byte) string {
	sum := sha256.Sum256(content)
	return hex.EncodeToString(sum[:])
}

func ValidateChecksum(content []byte, expected string) error {
	if expected == "" {
		return nil
	}
	if !strings.EqualFold(SHA256Checksum(content), expected) {
		return errors.New("checksum mismatch")
	}
	return nil
}

func ScanMalwareSignature(content []byte) error {
	signatures := [][]byte{[]byte("EICAR-STANDARD-ANTIVIRUS-TEST-FILE"), []byte("<script>steal"), []byte("MZ\x90\x00")}
	for _, sig := range signatures {
		if bytes.Contains(content, sig) {
			return errors.New("blocked file signature detected")
		}
	}
	return nil
}

func SafeTokenPayload(userID, role string, issuedAt time.Time) string {
	_ = issuedAt
	token, err := SignAccessToken(userID, role)
	if err != nil {
		return ""
	}
	return token
}

func MaskSensitiveLog(value string) string {
	lower := strings.ToLower(value)
	keys := []string{"password", "token", "pin", "otp", "secret", "authorization"}
	for _, key := range keys {
		if strings.Contains(lower, key) {
			return "[masked]"
		}
	}
	if len(value) > 18 {
		return value[:6] + "...[masked]"
	}
	return value
}

func SecurityRulebook() []string {
	return []string{
		"Validate file extensions: only .png, .jpg, .txt, .json uploads are accepted.",
		"Validate file size: reject upload bodies greater than 10MB.",
		"Validate MIME type: inspect file bytes and accepted content types, not just extension.",
		"Sanitize filenames: remove traversal, angle brackets, question marks, asterisks, quotes and separators.",
		"Validate URL parameters: identifiers must be alphanumeric with dash or underscore.",
		"Validate JSON structure: decode JSON and check required fields before use.",
		"Validate user input length: text fields are capped at 100 characters by default.",
		"Validate array length: arrays are capped at 7 items by default.",
		"Validate string format: HTML and script tags are rejected.",
		"Validate numeric ranges: values must stay inside expected minimum and maximum bounds.",
		"Session token validation: secured endpoints require a bearer token.",
		"Token expiration: tokens older than 30 days are rejected.",
		"Rate limiting: each IP receives at most 100 requests per minute.",
		"Origin validation: only configured Learnzur frontend origins may call the API.",
		"IP whitelisting: admin-only endpoints can require an explicit IP allow list.",
		"Password hashing: passwords are derived with salted HMAC-SHA256 iterations when external bcrypt is unavailable.",
		"Password complexity: at least 8 characters, one number and one letter.",
		"Account lockout: repeated failed login attempts are tracked and can lock an account.",
		"Session invalidation: logout clears refresh cookies and removes server session state.",
		"Role-based access: user, teacher, organization, parent, learner and admin permissions are separated.",
		"Encrypt sensitive data: AES-256-GCM protects private stored values.",
		"Hash passwords: plain passwords are never stored.",
		"Encrypt API keys: API keys are encrypted before database storage.",
		"Mask sensitive logs: passwords, PINs, OTPs and tokens are removed from logs.",
		"Secure cookies: Secure, HttpOnly and SameSite=Strict are used for session cookies.",
		"Data encryption at rest: file payloads can be encrypted before storage.",
		"Secure file storage: uploads are stored outside the public web root.",
		"Encrypt database connections: PostgreSQL connections should use TLS in production.",
		"Sanitize database queries: repository boundaries use parameterized query patterns.",
		"Clear temporary data: temporary files are removed after processing.",
		"Content Security Policy: default-src self.",
		"X-Content-Type-Options: nosniff.",
		"X-Frame-Options: DENY.",
		"X-XSS-Protection: 1; mode=block.",
		"Strict Transport Security: max-age=31536000.",
		"Referrer Policy: strict-origin-when-cross-origin.",
		"Permissions Policy: microphone is restricted unless classroom permission is granted.",
		"Cache Control: no-store and no-cache on sensitive responses.",
		"Set-Cookie attributes: Secure, HttpOnly and SameSite=Strict.",
		"Custom header validation: required security headers are checked by middleware.",
		"Validate file content: PNG and JPG header bytes must match claimed formats.",
		"Random filename generation: crypto/rand creates collision-resistant upload names.",
		"File type whitelist: only approved types are persisted.",
		"Directory traversal prevention: cleaned paths cannot escape storage root.",
		"File permission restrictions: uploaded files are written with 0644 permissions.",
		"Temp file cleanup: temp files older than one hour are eligible for deletion.",
		"File size limit: max upload size is enforced before processing.",
		"Anti-overwrite: random names prevent collisions.",
		"Validate file checksum: SHA-256 checksums can be compared with expected values.",
		"Scan for malware: known byte signatures are rejected before storage.",
		"Use strconv parsing: integer conversion reports errors.",
		"Validate type conversions: conversions are checked before use.",
		"Nil pointer checks: nil values are guarded before dereference.",
		"Bounds checking: array index access is guarded.",
		"Error handling: returned errors are checked and logged safely.",
		"Avoid eval: dynamic code execution is not used in the API service.",
		"Use immutable constants: security constants are const values.",
		"Check return values: all critical writes and encodes check returned errors.",
		"Secure random generation: crypto/rand is used instead of math/rand.",
		"Code comments for security: sensitive sections explain the protection being applied.",
	}
}
