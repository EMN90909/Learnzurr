package flag

import "errors"

type Repository struct{}

func (Repository) Namespace() string { return "learnzur:flag" }
func (Repository) SaveChatSandbox(result ChatScanResult, req ChatScanRequest) error {
	if req.UserID == "" {
		return errors.New("user id required")
	}
	return nil
}
func (Repository) BanUser(userID string, reason string) error {
	if userID == "" {
		return errors.New("user id required")
	}
	return nil
}
