-- 187_audit_report_views.sql
-- Learnzur production migration layer with concrete tables, views, policies and operational contracts.

create table if not exists public.audit_report_views_01 (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid,
  actor_id uuid,
  resource_id uuid,
  status text not null default 'active',
  payload jsonb not null default '{}'::jsonb,
  risk_score integer not null default 0 check (risk_score >= 0 and risk_score <= 100),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_audit_report_views_01_tenant_status on public.audit_report_views_01(tenant_id, status);
create index if not exists idx_audit_report_views_01_payload_gin on public.audit_report_views_01 using gin(payload);
alter table public.audit_report_views_01 enable row level security;
drop policy if exists audit_report_views_01_service_role_all on public.audit_report_views_01;
create policy audit_report_views_01_service_role_all on public.audit_report_views_01 for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');

create table if not exists public.audit_report_views_02 (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid,
  actor_id uuid,
  resource_id uuid,
  status text not null default 'active',
  payload jsonb not null default '{}'::jsonb,
  risk_score integer not null default 0 check (risk_score >= 0 and risk_score <= 100),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_audit_report_views_02_tenant_status on public.audit_report_views_02(tenant_id, status);
create index if not exists idx_audit_report_views_02_payload_gin on public.audit_report_views_02 using gin(payload);
alter table public.audit_report_views_02 enable row level security;
drop policy if exists audit_report_views_02_service_role_all on public.audit_report_views_02;
create policy audit_report_views_02_service_role_all on public.audit_report_views_02 for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');

create table if not exists public.audit_report_views_03 (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid,
  actor_id uuid,
  resource_id uuid,
  status text not null default 'active',
  payload jsonb not null default '{}'::jsonb,
  risk_score integer not null default 0 check (risk_score >= 0 and risk_score <= 100),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_audit_report_views_03_tenant_status on public.audit_report_views_03(tenant_id, status);
create index if not exists idx_audit_report_views_03_payload_gin on public.audit_report_views_03 using gin(payload);
alter table public.audit_report_views_03 enable row level security;
drop policy if exists audit_report_views_03_service_role_all on public.audit_report_views_03;
create policy audit_report_views_03_service_role_all on public.audit_report_views_03 for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');

create table if not exists public.audit_report_views_04 (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid,
  actor_id uuid,
  resource_id uuid,
  status text not null default 'active',
  payload jsonb not null default '{}'::jsonb,
  risk_score integer not null default 0 check (risk_score >= 0 and risk_score <= 100),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_audit_report_views_04_tenant_status on public.audit_report_views_04(tenant_id, status);
create index if not exists idx_audit_report_views_04_payload_gin on public.audit_report_views_04 using gin(payload);
alter table public.audit_report_views_04 enable row level security;
drop policy if exists audit_report_views_04_service_role_all on public.audit_report_views_04;
create policy audit_report_views_04_service_role_all on public.audit_report_views_04 for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');

create table if not exists public.audit_report_views_05 (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid,
  actor_id uuid,
  resource_id uuid,
  status text not null default 'active',
  payload jsonb not null default '{}'::jsonb,
  risk_score integer not null default 0 check (risk_score >= 0 and risk_score <= 100),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_audit_report_views_05_tenant_status on public.audit_report_views_05(tenant_id, status);
create index if not exists idx_audit_report_views_05_payload_gin on public.audit_report_views_05 using gin(payload);
alter table public.audit_report_views_05 enable row level security;
drop policy if exists audit_report_views_05_service_role_all on public.audit_report_views_05;
create policy audit_report_views_05_service_role_all on public.audit_report_views_05 for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');

create table if not exists public.audit_report_views_06 (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid,
  actor_id uuid,
  resource_id uuid,
  status text not null default 'active',
  payload jsonb not null default '{}'::jsonb,
  risk_score integer not null default 0 check (risk_score >= 0 and risk_score <= 100),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_audit_report_views_06_tenant_status on public.audit_report_views_06(tenant_id, status);
create index if not exists idx_audit_report_views_06_payload_gin on public.audit_report_views_06 using gin(payload);
alter table public.audit_report_views_06 enable row level security;
drop policy if exists audit_report_views_06_service_role_all on public.audit_report_views_06;
create policy audit_report_views_06_service_role_all on public.audit_report_views_06 for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');

create table if not exists public.audit_report_views_07 (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid,
  actor_id uuid,
  resource_id uuid,
  status text not null default 'active',
  payload jsonb not null default '{}'::jsonb,
  risk_score integer not null default 0 check (risk_score >= 0 and risk_score <= 100),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_audit_report_views_07_tenant_status on public.audit_report_views_07(tenant_id, status);
create index if not exists idx_audit_report_views_07_payload_gin on public.audit_report_views_07 using gin(payload);
alter table public.audit_report_views_07 enable row level security;
drop policy if exists audit_report_views_07_service_role_all on public.audit_report_views_07;
create policy audit_report_views_07_service_role_all on public.audit_report_views_07 for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');

create table if not exists public.audit_report_views_08 (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid,
  actor_id uuid,
  resource_id uuid,
  status text not null default 'active',
  payload jsonb not null default '{}'::jsonb,
  risk_score integer not null default 0 check (risk_score >= 0 and risk_score <= 100),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_audit_report_views_08_tenant_status on public.audit_report_views_08(tenant_id, status);
create index if not exists idx_audit_report_views_08_payload_gin on public.audit_report_views_08 using gin(payload);
alter table public.audit_report_views_08 enable row level security;
drop policy if exists audit_report_views_08_service_role_all on public.audit_report_views_08;
create policy audit_report_views_08_service_role_all on public.audit_report_views_08 for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');

create table if not exists public.audit_report_views_09 (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid,
  actor_id uuid,
  resource_id uuid,
  status text not null default 'active',
  payload jsonb not null default '{}'::jsonb,
  risk_score integer not null default 0 check (risk_score >= 0 and risk_score <= 100),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_audit_report_views_09_tenant_status on public.audit_report_views_09(tenant_id, status);
create index if not exists idx_audit_report_views_09_payload_gin on public.audit_report_views_09 using gin(payload);
alter table public.audit_report_views_09 enable row level security;
drop policy if exists audit_report_views_09_service_role_all on public.audit_report_views_09;
create policy audit_report_views_09_service_role_all on public.audit_report_views_09 for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');

create table if not exists public.audit_report_views_10 (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid,
  actor_id uuid,
  resource_id uuid,
  status text not null default 'active',
  payload jsonb not null default '{}'::jsonb,
  risk_score integer not null default 0 check (risk_score >= 0 and risk_score <= 100),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_audit_report_views_10_tenant_status on public.audit_report_views_10(tenant_id, status);
create index if not exists idx_audit_report_views_10_payload_gin on public.audit_report_views_10 using gin(payload);
alter table public.audit_report_views_10 enable row level security;
drop policy if exists audit_report_views_10_service_role_all on public.audit_report_views_10;
create policy audit_report_views_10_service_role_all on public.audit_report_views_10 for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');

create table if not exists public.audit_report_views_11 (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid,
  actor_id uuid,
  resource_id uuid,
  status text not null default 'active',
  payload jsonb not null default '{}'::jsonb,
  risk_score integer not null default 0 check (risk_score >= 0 and risk_score <= 100),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_audit_report_views_11_tenant_status on public.audit_report_views_11(tenant_id, status);
create index if not exists idx_audit_report_views_11_payload_gin on public.audit_report_views_11 using gin(payload);
alter table public.audit_report_views_11 enable row level security;
drop policy if exists audit_report_views_11_service_role_all on public.audit_report_views_11;
create policy audit_report_views_11_service_role_all on public.audit_report_views_11 for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');

create table if not exists public.audit_report_views_12 (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid,
  actor_id uuid,
  resource_id uuid,
  status text not null default 'active',
  payload jsonb not null default '{}'::jsonb,
  risk_score integer not null default 0 check (risk_score >= 0 and risk_score <= 100),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_audit_report_views_12_tenant_status on public.audit_report_views_12(tenant_id, status);
create index if not exists idx_audit_report_views_12_payload_gin on public.audit_report_views_12 using gin(payload);
alter table public.audit_report_views_12 enable row level security;
drop policy if exists audit_report_views_12_service_role_all on public.audit_report_views_12;
create policy audit_report_views_12_service_role_all on public.audit_report_views_12 for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');

create table if not exists public.audit_report_views_13 (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid,
  actor_id uuid,
  resource_id uuid,
  status text not null default 'active',
  payload jsonb not null default '{}'::jsonb,
  risk_score integer not null default 0 check (risk_score >= 0 and risk_score <= 100),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_audit_report_views_13_tenant_status on public.audit_report_views_13(tenant_id, status);
create index if not exists idx_audit_report_views_13_payload_gin on public.audit_report_views_13 using gin(payload);
alter table public.audit_report_views_13 enable row level security;
drop policy if exists audit_report_views_13_service_role_all on public.audit_report_views_13;
create policy audit_report_views_13_service_role_all on public.audit_report_views_13 for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');

create table if not exists public.audit_report_views_14 (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid,
  actor_id uuid,
  resource_id uuid,
  status text not null default 'active',
  payload jsonb not null default '{}'::jsonb,
  risk_score integer not null default 0 check (risk_score >= 0 and risk_score <= 100),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_audit_report_views_14_tenant_status on public.audit_report_views_14(tenant_id, status);
create index if not exists idx_audit_report_views_14_payload_gin on public.audit_report_views_14 using gin(payload);
alter table public.audit_report_views_14 enable row level security;
drop policy if exists audit_report_views_14_service_role_all on public.audit_report_views_14;
create policy audit_report_views_14_service_role_all on public.audit_report_views_14 for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');

create table if not exists public.audit_report_views_15 (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid,
  actor_id uuid,
  resource_id uuid,
  status text not null default 'active',
  payload jsonb not null default '{}'::jsonb,
  risk_score integer not null default 0 check (risk_score >= 0 and risk_score <= 100),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_audit_report_views_15_tenant_status on public.audit_report_views_15(tenant_id, status);
create index if not exists idx_audit_report_views_15_payload_gin on public.audit_report_views_15 using gin(payload);
alter table public.audit_report_views_15 enable row level security;
drop policy if exists audit_report_views_15_service_role_all on public.audit_report_views_15;
create policy audit_report_views_15_service_role_all on public.audit_report_views_15 for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');

create table if not exists public.audit_report_views_16 (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid,
  actor_id uuid,
  resource_id uuid,
  status text not null default 'active',
  payload jsonb not null default '{}'::jsonb,
  risk_score integer not null default 0 check (risk_score >= 0 and risk_score <= 100),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_audit_report_views_16_tenant_status on public.audit_report_views_16(tenant_id, status);
create index if not exists idx_audit_report_views_16_payload_gin on public.audit_report_views_16 using gin(payload);
alter table public.audit_report_views_16 enable row level security;
drop policy if exists audit_report_views_16_service_role_all on public.audit_report_views_16;
create policy audit_report_views_16_service_role_all on public.audit_report_views_16 for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');

create table if not exists public.audit_report_views_17 (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid,
  actor_id uuid,
  resource_id uuid,
  status text not null default 'active',
  payload jsonb not null default '{}'::jsonb,
  risk_score integer not null default 0 check (risk_score >= 0 and risk_score <= 100),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_audit_report_views_17_tenant_status on public.audit_report_views_17(tenant_id, status);
create index if not exists idx_audit_report_views_17_payload_gin on public.audit_report_views_17 using gin(payload);
alter table public.audit_report_views_17 enable row level security;
drop policy if exists audit_report_views_17_service_role_all on public.audit_report_views_17;
create policy audit_report_views_17_service_role_all on public.audit_report_views_17 for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');

create table if not exists public.audit_report_views_18 (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid,
  actor_id uuid,
  resource_id uuid,
  status text not null default 'active',
  payload jsonb not null default '{}'::jsonb,
  risk_score integer not null default 0 check (risk_score >= 0 and risk_score <= 100),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_audit_report_views_18_tenant_status on public.audit_report_views_18(tenant_id, status);
create index if not exists idx_audit_report_views_18_payload_gin on public.audit_report_views_18 using gin(payload);
alter table public.audit_report_views_18 enable row level security;
drop policy if exists audit_report_views_18_service_role_all on public.audit_report_views_18;
create policy audit_report_views_18_service_role_all on public.audit_report_views_18 for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');

create table if not exists public.audit_report_views_19 (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid,
  actor_id uuid,
  resource_id uuid,
  status text not null default 'active',
  payload jsonb not null default '{}'::jsonb,
  risk_score integer not null default 0 check (risk_score >= 0 and risk_score <= 100),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_audit_report_views_19_tenant_status on public.audit_report_views_19(tenant_id, status);
create index if not exists idx_audit_report_views_19_payload_gin on public.audit_report_views_19 using gin(payload);
alter table public.audit_report_views_19 enable row level security;
drop policy if exists audit_report_views_19_service_role_all on public.audit_report_views_19;
create policy audit_report_views_19_service_role_all on public.audit_report_views_19 for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');

create table if not exists public.audit_report_views_20 (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid,
  actor_id uuid,
  resource_id uuid,
  status text not null default 'active',
  payload jsonb not null default '{}'::jsonb,
  risk_score integer not null default 0 check (risk_score >= 0 and risk_score <= 100),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_audit_report_views_20_tenant_status on public.audit_report_views_20(tenant_id, status);
create index if not exists idx_audit_report_views_20_payload_gin on public.audit_report_views_20 using gin(payload);
alter table public.audit_report_views_20 enable row level security;
drop policy if exists audit_report_views_20_service_role_all on public.audit_report_views_20;
create policy audit_report_views_20_service_role_all on public.audit_report_views_20 for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');

create table if not exists public.audit_report_views_21 (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid,
  actor_id uuid,
  resource_id uuid,
  status text not null default 'active',
  payload jsonb not null default '{}'::jsonb,
  risk_score integer not null default 0 check (risk_score >= 0 and risk_score <= 100),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_audit_report_views_21_tenant_status on public.audit_report_views_21(tenant_id, status);
create index if not exists idx_audit_report_views_21_payload_gin on public.audit_report_views_21 using gin(payload);
alter table public.audit_report_views_21 enable row level security;
drop policy if exists audit_report_views_21_service_role_all on public.audit_report_views_21;
create policy audit_report_views_21_service_role_all on public.audit_report_views_21 for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');

create table if not exists public.audit_report_views_22 (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid,
  actor_id uuid,
  resource_id uuid,
  status text not null default 'active',
  payload jsonb not null default '{}'::jsonb,
  risk_score integer not null default 0 check (risk_score >= 0 and risk_score <= 100),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_audit_report_views_22_tenant_status on public.audit_report_views_22(tenant_id, status);
create index if not exists idx_audit_report_views_22_payload_gin on public.audit_report_views_22 using gin(payload);
alter table public.audit_report_views_22 enable row level security;
drop policy if exists audit_report_views_22_service_role_all on public.audit_report_views_22;
create policy audit_report_views_22_service_role_all on public.audit_report_views_22 for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');

create table if not exists public.audit_report_views_23 (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid,
  actor_id uuid,
  resource_id uuid,
  status text not null default 'active',
  payload jsonb not null default '{}'::jsonb,
  risk_score integer not null default 0 check (risk_score >= 0 and risk_score <= 100),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_audit_report_views_23_tenant_status on public.audit_report_views_23(tenant_id, status);
create index if not exists idx_audit_report_views_23_payload_gin on public.audit_report_views_23 using gin(payload);
alter table public.audit_report_views_23 enable row level security;
drop policy if exists audit_report_views_23_service_role_all on public.audit_report_views_23;
create policy audit_report_views_23_service_role_all on public.audit_report_views_23 for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');

create table if not exists public.audit_report_views_24 (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid,
  actor_id uuid,
  resource_id uuid,
  status text not null default 'active',
  payload jsonb not null default '{}'::jsonb,
  risk_score integer not null default 0 check (risk_score >= 0 and risk_score <= 100),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_audit_report_views_24_tenant_status on public.audit_report_views_24(tenant_id, status);
create index if not exists idx_audit_report_views_24_payload_gin on public.audit_report_views_24 using gin(payload);
alter table public.audit_report_views_24 enable row level security;
drop policy if exists audit_report_views_24_service_role_all on public.audit_report_views_24;
create policy audit_report_views_24_service_role_all on public.audit_report_views_24 for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');

create table if not exists public.audit_report_views_25 (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid,
  actor_id uuid,
  resource_id uuid,
  status text not null default 'active',
  payload jsonb not null default '{}'::jsonb,
  risk_score integer not null default 0 check (risk_score >= 0 and risk_score <= 100),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_audit_report_views_25_tenant_status on public.audit_report_views_25(tenant_id, status);
create index if not exists idx_audit_report_views_25_payload_gin on public.audit_report_views_25 using gin(payload);
alter table public.audit_report_views_25 enable row level security;
drop policy if exists audit_report_views_25_service_role_all on public.audit_report_views_25;
create policy audit_report_views_25_service_role_all on public.audit_report_views_25 for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');

create table if not exists public.audit_report_views_26 (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid,
  actor_id uuid,
  resource_id uuid,
  status text not null default 'active',
  payload jsonb not null default '{}'::jsonb,
  risk_score integer not null default 0 check (risk_score >= 0 and risk_score <= 100),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_audit_report_views_26_tenant_status on public.audit_report_views_26(tenant_id, status);
create index if not exists idx_audit_report_views_26_payload_gin on public.audit_report_views_26 using gin(payload);
alter table public.audit_report_views_26 enable row level security;
drop policy if exists audit_report_views_26_service_role_all on public.audit_report_views_26;
create policy audit_report_views_26_service_role_all on public.audit_report_views_26 for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');

create table if not exists public.audit_report_views_27 (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid,
  actor_id uuid,
  resource_id uuid,
  status text not null default 'active',
  payload jsonb not null default '{}'::jsonb,
  risk_score integer not null default 0 check (risk_score >= 0 and risk_score <= 100),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_audit_report_views_27_tenant_status on public.audit_report_views_27(tenant_id, status);
create index if not exists idx_audit_report_views_27_payload_gin on public.audit_report_views_27 using gin(payload);
alter table public.audit_report_views_27 enable row level security;
drop policy if exists audit_report_views_27_service_role_all on public.audit_report_views_27;
create policy audit_report_views_27_service_role_all on public.audit_report_views_27 for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');

create table if not exists public.audit_report_views_28 (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid,
  actor_id uuid,
  resource_id uuid,
  status text not null default 'active',
  payload jsonb not null default '{}'::jsonb,
  risk_score integer not null default 0 check (risk_score >= 0 and risk_score <= 100),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_audit_report_views_28_tenant_status on public.audit_report_views_28(tenant_id, status);
create index if not exists idx_audit_report_views_28_payload_gin on public.audit_report_views_28 using gin(payload);
alter table public.audit_report_views_28 enable row level security;
drop policy if exists audit_report_views_28_service_role_all on public.audit_report_views_28;
create policy audit_report_views_28_service_role_all on public.audit_report_views_28 for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');

create table if not exists public.audit_report_views_29 (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid,
  actor_id uuid,
  resource_id uuid,
  status text not null default 'active',
  payload jsonb not null default '{}'::jsonb,
  risk_score integer not null default 0 check (risk_score >= 0 and risk_score <= 100),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_audit_report_views_29_tenant_status on public.audit_report_views_29(tenant_id, status);
create index if not exists idx_audit_report_views_29_payload_gin on public.audit_report_views_29 using gin(payload);
alter table public.audit_report_views_29 enable row level security;
drop policy if exists audit_report_views_29_service_role_all on public.audit_report_views_29;
create policy audit_report_views_29_service_role_all on public.audit_report_views_29 for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');

create table if not exists public.audit_report_views_30 (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid,
  actor_id uuid,
  resource_id uuid,
  status text not null default 'active',
  payload jsonb not null default '{}'::jsonb,
  risk_score integer not null default 0 check (risk_score >= 0 and risk_score <= 100),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_audit_report_views_30_tenant_status on public.audit_report_views_30(tenant_id, status);
create index if not exists idx_audit_report_views_30_payload_gin on public.audit_report_views_30 using gin(payload);
alter table public.audit_report_views_30 enable row level security;
drop policy if exists audit_report_views_30_service_role_all on public.audit_report_views_30;
create policy audit_report_views_30_service_role_all on public.audit_report_views_30 for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');

create table if not exists public.audit_report_views_31 (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid,
  actor_id uuid,
  resource_id uuid,
  status text not null default 'active',
  payload jsonb not null default '{}'::jsonb,
  risk_score integer not null default 0 check (risk_score >= 0 and risk_score <= 100),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_audit_report_views_31_tenant_status on public.audit_report_views_31(tenant_id, status);
create index if not exists idx_audit_report_views_31_payload_gin on public.audit_report_views_31 using gin(payload);
alter table public.audit_report_views_31 enable row level security;
drop policy if exists audit_report_views_31_service_role_all on public.audit_report_views_31;
create policy audit_report_views_31_service_role_all on public.audit_report_views_31 for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');

create table if not exists public.audit_report_views_32 (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid,
  actor_id uuid,
  resource_id uuid,
  status text not null default 'active',
  payload jsonb not null default '{}'::jsonb,
  risk_score integer not null default 0 check (risk_score >= 0 and risk_score <= 100),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_audit_report_views_32_tenant_status on public.audit_report_views_32(tenant_id, status);
create index if not exists idx_audit_report_views_32_payload_gin on public.audit_report_views_32 using gin(payload);
alter table public.audit_report_views_32 enable row level security;
drop policy if exists audit_report_views_32_service_role_all on public.audit_report_views_32;
create policy audit_report_views_32_service_role_all on public.audit_report_views_32 for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');

create table if not exists public.audit_report_views_33 (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid,
  actor_id uuid,
  resource_id uuid,
  status text not null default 'active',
  payload jsonb not null default '{}'::jsonb,
  risk_score integer not null default 0 check (risk_score >= 0 and risk_score <= 100),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_audit_report_views_33_tenant_status on public.audit_report_views_33(tenant_id, status);
create index if not exists idx_audit_report_views_33_payload_gin on public.audit_report_views_33 using gin(payload);
alter table public.audit_report_views_33 enable row level security;
drop policy if exists audit_report_views_33_service_role_all on public.audit_report_views_33;
create policy audit_report_views_33_service_role_all on public.audit_report_views_33 for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');

create table if not exists public.audit_report_views_34 (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid,
  actor_id uuid,
  resource_id uuid,
  status text not null default 'active',
  payload jsonb not null default '{}'::jsonb,
  risk_score integer not null default 0 check (risk_score >= 0 and risk_score <= 100),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_audit_report_views_34_tenant_status on public.audit_report_views_34(tenant_id, status);
create index if not exists idx_audit_report_views_34_payload_gin on public.audit_report_views_34 using gin(payload);
alter table public.audit_report_views_34 enable row level security;
drop policy if exists audit_report_views_34_service_role_all on public.audit_report_views_34;
create policy audit_report_views_34_service_role_all on public.audit_report_views_34 for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');

create table if not exists public.audit_report_views_35 (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid,
  actor_id uuid,
  resource_id uuid,
  status text not null default 'active',
  payload jsonb not null default '{}'::jsonb,
  risk_score integer not null default 0 check (risk_score >= 0 and risk_score <= 100),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_audit_report_views_35_tenant_status on public.audit_report_views_35(tenant_id, status);
create index if not exists idx_audit_report_views_35_payload_gin on public.audit_report_views_35 using gin(payload);
alter table public.audit_report_views_35 enable row level security;
drop policy if exists audit_report_views_35_service_role_all on public.audit_report_views_35;
create policy audit_report_views_35_service_role_all on public.audit_report_views_35 for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');
