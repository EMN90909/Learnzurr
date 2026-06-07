package security

import "strings"

func Sanitize(s string) string {
	s = strings.ReplaceAll(s, "\x00", "")
	s = strings.ReplaceAll(s, "<", "")
	s = strings.ReplaceAll(s, ">", "")
	s = strings.ReplaceAll(s, "../", "")
	s = strings.ReplaceAll(s, "..\\", "")
	return strings.TrimSpace(s)
}

func SanitizePathSegment(s string) string {
	s = SanitizeFilename(s)
	s = strings.ReplaceAll(s, "/", "")
	s = strings.ReplaceAll(s, "\\", "")
	return s
}
