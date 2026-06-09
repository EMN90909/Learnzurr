package main

import "fmt"

type Job struct { Type string; Payload []byte }
func Dispatch(job Job) error {
  switch job.Type {
  case "email.send", "media.encode_video", "media.generate_pdf", "notify.push", "flag.scan_chat", "mearn.process_payout", "gamfy.award_points": return nil
  default: return fmt.Errorf("unknown job type: %s", job.Type)
  }
}
