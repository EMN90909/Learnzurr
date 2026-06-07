package flagengine

import (
	"context"

	internalflag "learnzur/backend/engines/flag/internal/flag"
)

type ChatScanRequest = internalflag.ChatScanRequest
type ChatScanResult = internalflag.ChatScanResult

type Service struct{ inner internalflag.Service }

func NewService() Service { return Service{inner: internalflag.NewService()} }
func (s Service) ScanChat(ctx context.Context, req ChatScanRequest) ChatScanResult {
	return s.inner.ScanChat(ctx, req)
}
