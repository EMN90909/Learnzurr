package security

import (
	"net"
	"os"
	"strings"
)

func IsBlacklistedIP(ip string) bool {
	parsed := net.ParseIP(strings.TrimSpace(ip))
	if parsed == nil {
		return true
	}
	for _, blocked := range strings.Split(os.Getenv("LEARNZUR_IP_BLACKLIST"), ",") {
		if strings.TrimSpace(blocked) == parsed.String() {
			return true
		}
	}
	return false
}

func IsWhitelistedAdminIP(ip string) bool {
	allowed := strings.TrimSpace(os.Getenv("LEARNZUR_ADMIN_IP_WHITELIST"))
	if allowed == "" {
		return true
	}
	parsed := net.ParseIP(strings.TrimSpace(ip))
	if parsed == nil {
		return false
	}
	for _, entry := range strings.Split(allowed, ",") {
		if strings.TrimSpace(entry) == parsed.String() {
			return true
		}
	}
	return false
}

func IsRestrictedUser(userID string) bool { return strings.TrimSpace(userID) == "" }
