package main

import "context"

type Job struct {
	Type    string
	Payload map[string]any
}

func Dispatch(ctx context.Context, job Job) error {
	switch job.Type {
	case "email.send", "media.encode_video", "media.generate_pdf", "notify.push", "flag.scan_chat", "mearn.process_payout", "gamfy.award_points", "heartbeat":
		return nil
	default:
		return nil
	}
}
