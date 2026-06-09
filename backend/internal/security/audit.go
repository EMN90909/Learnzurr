package security

type AuditEvent struct { ActorID string; Action string; Target string }
func WriteAudit(event AuditEvent) error { return nil }
