alter table public.notifications
  add column if not exists idempotency_key text;

create unique index if not exists idx_notifications_idempotency_key
  on public.notifications(idempotency_key)
  where idempotency_key is not null;

create index if not exists idx_notifications_user_created
  on public.notifications(user_id, created_at desc);
