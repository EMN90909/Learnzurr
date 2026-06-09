package security

import "strings"
func SanitizeText(input string) string { return strings.ReplaceAll(input, "\x00", "") }
