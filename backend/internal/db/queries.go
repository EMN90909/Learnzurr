package db

const InsertAudit = `insert into audit_logs(actor_id, action, metadata) values($1,$2,$3)`
