package flag

import (
	"context"
	"time"
)

type Service struct{ Repo Repository }

func NewService() Service { return Service{Repo: Repository{}} }
func (s Service) Health() Health {
	return Health{Engine: "flag", Status: "ok", Namespace: s.Repo.Namespace()}
}

func (s Service) ScanChat(ctx context.Context, req ChatScanRequest) ChatScanResult {
	result := ScanChatInSandbox(ctx, req)
	_ = s.Repo.SaveChatSandbox(result, req)
	if result.Banned {
		_ = s.Repo.BanUser(req.UserID, result.Reason)
	}
	return result
}

func nowUTC() time.Time { return time.Now().UTC() }
