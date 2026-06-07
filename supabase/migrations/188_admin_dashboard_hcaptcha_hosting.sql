-- Learnzur admin dashboard, hCaptcha, hosting config, and audit support.
create table if not exists admin_action_requirements (
  id uuid primary key default gen_random_uuid(),
  action text not null unique,
  requires_super_admin boolean not null default false,
  requires_reason boolean not null default true,
  requires_confirmation boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists admin_dashboard_widgets (
  id uuid primary key default gen_random_uuid(),
  widget_key text not null unique,
  title text not null,
  data_source text not null,
  min_role text not null default 'admin',
  is_enabled boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists auth_captcha_events (
  id uuid primary key default gen_random_uuid(),
  purpose text not null,
  email_hash text,
  ip_hash text,
  success boolean not null,
  provider text not null default 'hcaptcha',
  created_at timestamptz not null default now()
);

create table if not exists email_otp_events (
  id uuid primary key default gen_random_uuid(),
  email_hash text not null,
  purpose text not null,
  provider text not null default 'resend',
  template_name text not null default 'learnzur_otp',
  status text not null default 'queued',
  expires_at timestamptz not null default (now() + interval '10 minutes'),
  created_at timestamptz not null default now()
);

insert into admin_action_requirements(action, requires_super_admin, requires_reason, requires_confirmation) values
('teacher.approve', false, true, false),('teacher.reject', false, true, true),('user.ban', true, true, true),('payout.approve', true, true, true),('treasury.adjust', true, true, true),('feature_flag.update', true, true, true),('marketplace.reject', false, true, false),('security.blacklist', true, true, true)
on conflict(action) do update set requires_super_admin=excluded.requires_super_admin, requires_reason=excluded.requires_reason, requires_confirmation=excluded.requires_confirmation;

insert into admin_dashboard_widgets(widget_key,title,data_source,min_role) values
('platform_stats','Live platform stats','platform_stats','admin'),('teacher_approvals','Pending teacher approvals','teacher_profiles','admin'),('mearn_treasury','Mearn treasury','treasury_pots','super_admin'),('flagged_content','Flagged content','flag_records','admin'),('media_queue','Media queue','media_jobs','admin'),('security_alerts','Security alerts','fraud_flags','super_admin')
on conflict(widget_key) do update set title=excluded.title, data_source=excluded.data_source, min_role=excluded.min_role;

alter table admin_action_requirements enable row level security;
alter table admin_dashboard_widgets enable row level security;
alter table auth_captcha_events enable row level security;
alter table email_otp_events enable row level security;

do $$ begin
  execute 'create policy admin_action_requirements_select on admin_action_requirements for select using (true)';
exception when duplicate_object then null; end $$;
do $$ begin
  execute 'create policy admin_dashboard_widgets_select on admin_dashboard_widgets for select using (is_enabled = true)';
exception when duplicate_object then null; end $$;
