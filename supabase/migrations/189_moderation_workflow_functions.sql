-- 189_moderation_workflow_functions.sql
-- Learnzur production migration layer with concrete tables, views, policies and operational contracts.

create table if not exists public.moderation_workflow_functions_01 (
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
create index if not exists idx_moderation_workflow_functions_01_tenant_status on public.moderation_workflow_functions_01(tenant_id, status);
create index if not exists idx_moderation_workflow_functions_01_payload_gin on public.moderation_workflow_functions_01 using gin(payload);
alter table public.moderation_workflow_functions_01 enable row level security;
drop policy if exists moderation_workflow_functions_01_service_role_all on public.moderation_workflow_functions_01;
create policy moderation_workflow_functions_01_service_role_all on public.moderation_workflow_functions_01 for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');

create table if not exists public.moderation_workflow_functions_02 (
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
create index if not exists idx_moderation_workflow_functions_02_tenant_status on public.moderation_workflow_functions_02(tenant_id, status);
create index if not exists idx_moderation_workflow_functions_02_payload_gin on public.moderation_workflow_functions_02 using gin(payload);
alter table public.moderation_workflow_functions_02 enable row level security;
drop policy if exists moderation_workflow_functions_02_service_role_all on public.moderation_workflow_functions_02;
create policy moderation_workflow_functions_02_service_role_all on public.moderation_workflow_functions_02 for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');

create table if not exists public.moderation_workflow_functions_03 (
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
create index if not exists idx_moderation_workflow_functions_03_tenant_status on public.moderation_workflow_functions_03(tenant_id, status);
create index if not exists idx_moderation_workflow_functions_03_payload_gin on public.moderation_workflow_functions_03 using gin(payload);
alter table public.moderation_workflow_functions_03 enable row level security;
drop policy if exists moderation_workflow_functions_03_service_role_all on public.moderation_workflow_functions_03;
create policy moderation_workflow_functions_03_service_role_all on public.moderation_workflow_functions_03 for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');

create table if not exists public.moderation_workflow_functions_04 (
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
create index if not exists idx_moderation_workflow_functions_04_tenant_status on public.moderation_workflow_functions_04(tenant_id, status);
create index if not exists idx_moderation_workflow_functions_04_payload_gin on public.moderation_workflow_functions_04 using gin(payload);
alter table public.moderation_workflow_functions_04 enable row level security;
drop policy if exists moderation_workflow_functions_04_service_role_all on public.moderation_workflow_functions_04;
create policy moderation_workflow_functions_04_service_role_all on public.moderation_workflow_functions_04 for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');

create table if not exists public.moderation_workflow_functions_05 (
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
create index if not exists idx_moderation_workflow_functions_05_tenant_status on public.moderation_workflow_functions_05(tenant_id, status);
create index if not exists idx_moderation_workflow_functions_05_payload_gin on public.moderation_workflow_functions_05 using gin(payload);
alter table public.moderation_workflow_functions_05 enable row level security;
drop policy if exists moderation_workflow_functions_05_service_role_all on public.moderation_workflow_functions_05;
create policy moderation_workflow_functions_05_service_role_all on public.moderation_workflow_functions_05 for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');

create table if not exists public.moderation_workflow_functions_06 (
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
create index if not exists idx_moderation_workflow_functions_06_tenant_status on public.moderation_workflow_functions_06(tenant_id, status);
create index if not exists idx_moderation_workflow_functions_06_payload_gin on public.moderation_workflow_functions_06 using gin(payload);
alter table public.moderation_workflow_functions_06 enable row level security;
drop policy if exists moderation_workflow_functions_06_service_role_all on public.moderation_workflow_functions_06;
create policy moderation_workflow_functions_06_service_role_all on public.moderation_workflow_functions_06 for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');

create table if not exists public.moderation_workflow_functions_07 (
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
create index if not exists idx_moderation_workflow_functions_07_tenant_status on public.moderation_workflow_functions_07(tenant_id, status);
create index if not exists idx_moderation_workflow_functions_07_payload_gin on public.moderation_workflow_functions_07 using gin(payload);
alter table public.moderation_workflow_functions_07 enable row level security;
drop policy if exists moderation_workflow_functions_07_service_role_all on public.moderation_workflow_functions_07;
create policy moderation_workflow_functions_07_service_role_all on public.moderation_workflow_functions_07 for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');

create table if not exists public.moderation_workflow_functions_08 (
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
create index if not exists idx_moderation_workflow_functions_08_tenant_status on public.moderation_workflow_functions_08(tenant_id, status);
create index if not exists idx_moderation_workflow_functions_08_payload_gin on public.moderation_workflow_functions_08 using gin(payload);
alter table public.moderation_workflow_functions_08 enable row level security;
drop policy if exists moderation_workflow_functions_08_service_role_all on public.moderation_workflow_functions_08;
create policy moderation_workflow_functions_08_service_role_all on public.moderation_workflow_functions_08 for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');

create table if not exists public.moderation_workflow_functions_09 (
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
create index if not exists idx_moderation_workflow_functions_09_tenant_status on public.moderation_workflow_functions_09(tenant_id, status);
create index if not exists idx_moderation_workflow_functions_09_payload_gin on public.moderation_workflow_functions_09 using gin(payload);
alter table public.moderation_workflow_functions_09 enable row level security;
drop policy if exists moderation_workflow_functions_09_service_role_all on public.moderation_workflow_functions_09;
create policy moderation_workflow_functions_09_service_role_all on public.moderation_workflow_functions_09 for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');

create table if not exists public.moderation_workflow_functions_10 (
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
create index if not exists idx_moderation_workflow_functions_10_tenant_status on public.moderation_workflow_functions_10(tenant_id, status);
create index if not exists idx_moderation_workflow_functions_10_payload_gin on public.moderation_workflow_functions_10 using gin(payload);
alter table public.moderation_workflow_functions_10 enable row level security;
drop policy if exists moderation_workflow_functions_10_service_role_all on public.moderation_workflow_functions_10;
create policy moderation_workflow_functions_10_service_role_all on public.moderation_workflow_functions_10 for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');

create table if not exists public.moderation_workflow_functions_11 (
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
create index if not exists idx_moderation_workflow_functions_11_tenant_status on public.moderation_workflow_functions_11(tenant_id, status);
create index if not exists idx_moderation_workflow_functions_11_payload_gin on public.moderation_workflow_functions_11 using gin(payload);
alter table public.moderation_workflow_functions_11 enable row level security;
drop policy if exists moderation_workflow_functions_11_service_role_all on public.moderation_workflow_functions_11;
create policy moderation_workflow_functions_11_service_role_all on public.moderation_workflow_functions_11 for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');

create table if not exists public.moderation_workflow_functions_12 (
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
create index if not exists idx_moderation_workflow_functions_12_tenant_status on public.moderation_workflow_functions_12(tenant_id, status);
create index if not exists idx_moderation_workflow_functions_12_payload_gin on public.moderation_workflow_functions_12 using gin(payload);
alter table public.moderation_workflow_functions_12 enable row level security;
drop policy if exists moderation_workflow_functions_12_service_role_all on public.moderation_workflow_functions_12;
create policy moderation_workflow_functions_12_service_role_all on public.moderation_workflow_functions_12 for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');

create table if not exists public.moderation_workflow_functions_13 (
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
create index if not exists idx_moderation_workflow_functions_13_tenant_status on public.moderation_workflow_functions_13(tenant_id, status);
create index if not exists idx_moderation_workflow_functions_13_payload_gin on public.moderation_workflow_functions_13 using gin(payload);
alter table public.moderation_workflow_functions_13 enable row level security;
drop policy if exists moderation_workflow_functions_13_service_role_all on public.moderation_workflow_functions_13;
create policy moderation_workflow_functions_13_service_role_all on public.moderation_workflow_functions_13 for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');

create table if not exists public.moderation_workflow_functions_14 (
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
create index if not exists idx_moderation_workflow_functions_14_tenant_status on public.moderation_workflow_functions_14(tenant_id, status);
create index if not exists idx_moderation_workflow_functions_14_payload_gin on public.moderation_workflow_functions_14 using gin(payload);
alter table public.moderation_workflow_functions_14 enable row level security;
drop policy if exists moderation_workflow_functions_14_service_role_all on public.moderation_workflow_functions_14;
create policy moderation_workflow_functions_14_service_role_all on public.moderation_workflow_functions_14 for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');

create table if not exists public.moderation_workflow_functions_15 (
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
create index if not exists idx_moderation_workflow_functions_15_tenant_status on public.moderation_workflow_functions_15(tenant_id, status);
create index if not exists idx_moderation_workflow_functions_15_payload_gin on public.moderation_workflow_functions_15 using gin(payload);
alter table public.moderation_workflow_functions_15 enable row level security;
drop policy if exists moderation_workflow_functions_15_service_role_all on public.moderation_workflow_functions_15;
create policy moderation_workflow_functions_15_service_role_all on public.moderation_workflow_functions_15 for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');

create table if not exists public.moderation_workflow_functions_16 (
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
create index if not exists idx_moderation_workflow_functions_16_tenant_status on public.moderation_workflow_functions_16(tenant_id, status);
create index if not exists idx_moderation_workflow_functions_16_payload_gin on public.moderation_workflow_functions_16 using gin(payload);
alter table public.moderation_workflow_functions_16 enable row level security;
drop policy if exists moderation_workflow_functions_16_service_role_all on public.moderation_workflow_functions_16;
create policy moderation_workflow_functions_16_service_role_all on public.moderation_workflow_functions_16 for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');

create table if not exists public.moderation_workflow_functions_17 (
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
create index if not exists idx_moderation_workflow_functions_17_tenant_status on public.moderation_workflow_functions_17(tenant_id, status);
create index if not exists idx_moderation_workflow_functions_17_payload_gin on public.moderation_workflow_functions_17 using gin(payload);
alter table public.moderation_workflow_functions_17 enable row level security;
drop policy if exists moderation_workflow_functions_17_service_role_all on public.moderation_workflow_functions_17;
create policy moderation_workflow_functions_17_service_role_all on public.moderation_workflow_functions_17 for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');

create table if not exists public.moderation_workflow_functions_18 (
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
create index if not exists idx_moderation_workflow_functions_18_tenant_status on public.moderation_workflow_functions_18(tenant_id, status);
create index if not exists idx_moderation_workflow_functions_18_payload_gin on public.moderation_workflow_functions_18 using gin(payload);
alter table public.moderation_workflow_functions_18 enable row level security;
drop policy if exists moderation_workflow_functions_18_service_role_all on public.moderation_workflow_functions_18;
create policy moderation_workflow_functions_18_service_role_all on public.moderation_workflow_functions_18 for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');

create table if not exists public.moderation_workflow_functions_19 (
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
create index if not exists idx_moderation_workflow_functions_19_tenant_status on public.moderation_workflow_functions_19(tenant_id, status);
create index if not exists idx_moderation_workflow_functions_19_payload_gin on public.moderation_workflow_functions_19 using gin(payload);
alter table public.moderation_workflow_functions_19 enable row level security;
drop policy if exists moderation_workflow_functions_19_service_role_all on public.moderation_workflow_functions_19;
create policy moderation_workflow_functions_19_service_role_all on public.moderation_workflow_functions_19 for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');

create table if not exists public.moderation_workflow_functions_20 (
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
create index if not exists idx_moderation_workflow_functions_20_tenant_status on public.moderation_workflow_functions_20(tenant_id, status);
create index if not exists idx_moderation_workflow_functions_20_payload_gin on public.moderation_workflow_functions_20 using gin(payload);
alter table public.moderation_workflow_functions_20 enable row level security;
drop policy if exists moderation_workflow_functions_20_service_role_all on public.moderation_workflow_functions_20;
create policy moderation_workflow_functions_20_service_role_all on public.moderation_workflow_functions_20 for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');

create table if not exists public.moderation_workflow_functions_21 (
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
create index if not exists idx_moderation_workflow_functions_21_tenant_status on public.moderation_workflow_functions_21(tenant_id, status);
create index if not exists idx_moderation_workflow_functions_21_payload_gin on public.moderation_workflow_functions_21 using gin(payload);
alter table public.moderation_workflow_functions_21 enable row level security;
drop policy if exists moderation_workflow_functions_21_service_role_all on public.moderation_workflow_functions_21;
create policy moderation_workflow_functions_21_service_role_all on public.moderation_workflow_functions_21 for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');

create table if not exists public.moderation_workflow_functions_22 (
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
create index if not exists idx_moderation_workflow_functions_22_tenant_status on public.moderation_workflow_functions_22(tenant_id, status);
create index if not exists idx_moderation_workflow_functions_22_payload_gin on public.moderation_workflow_functions_22 using gin(payload);
alter table public.moderation_workflow_functions_22 enable row level security;
drop policy if exists moderation_workflow_functions_22_service_role_all on public.moderation_workflow_functions_22;
create policy moderation_workflow_functions_22_service_role_all on public.moderation_workflow_functions_22 for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');

create table if not exists public.moderation_workflow_functions_23 (
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
create index if not exists idx_moderation_workflow_functions_23_tenant_status on public.moderation_workflow_functions_23(tenant_id, status);
create index if not exists idx_moderation_workflow_functions_23_payload_gin on public.moderation_workflow_functions_23 using gin(payload);
alter table public.moderation_workflow_functions_23 enable row level security;
drop policy if exists moderation_workflow_functions_23_service_role_all on public.moderation_workflow_functions_23;
create policy moderation_workflow_functions_23_service_role_all on public.moderation_workflow_functions_23 for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');

create table if not exists public.moderation_workflow_functions_24 (
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
create index if not exists idx_moderation_workflow_functions_24_tenant_status on public.moderation_workflow_functions_24(tenant_id, status);
create index if not exists idx_moderation_workflow_functions_24_payload_gin on public.moderation_workflow_functions_24 using gin(payload);
alter table public.moderation_workflow_functions_24 enable row level security;
drop policy if exists moderation_workflow_functions_24_service_role_all on public.moderation_workflow_functions_24;
create policy moderation_workflow_functions_24_service_role_all on public.moderation_workflow_functions_24 for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');

create table if not exists public.moderation_workflow_functions_25 (
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
create index if not exists idx_moderation_workflow_functions_25_tenant_status on public.moderation_workflow_functions_25(tenant_id, status);
create index if not exists idx_moderation_workflow_functions_25_payload_gin on public.moderation_workflow_functions_25 using gin(payload);
alter table public.moderation_workflow_functions_25 enable row level security;
drop policy if exists moderation_workflow_functions_25_service_role_all on public.moderation_workflow_functions_25;
create policy moderation_workflow_functions_25_service_role_all on public.moderation_workflow_functions_25 for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');

create table if not exists public.moderation_workflow_functions_26 (
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
create index if not exists idx_moderation_workflow_functions_26_tenant_status on public.moderation_workflow_functions_26(tenant_id, status);
create index if not exists idx_moderation_workflow_functions_26_payload_gin on public.moderation_workflow_functions_26 using gin(payload);
alter table public.moderation_workflow_functions_26 enable row level security;
drop policy if exists moderation_workflow_functions_26_service_role_all on public.moderation_workflow_functions_26;
create policy moderation_workflow_functions_26_service_role_all on public.moderation_workflow_functions_26 for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');

create table if not exists public.moderation_workflow_functions_27 (
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
create index if not exists idx_moderation_workflow_functions_27_tenant_status on public.moderation_workflow_functions_27(tenant_id, status);
create index if not exists idx_moderation_workflow_functions_27_payload_gin on public.moderation_workflow_functions_27 using gin(payload);
alter table public.moderation_workflow_functions_27 enable row level security;
drop policy if exists moderation_workflow_functions_27_service_role_all on public.moderation_workflow_functions_27;
create policy moderation_workflow_functions_27_service_role_all on public.moderation_workflow_functions_27 for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');

create table if not exists public.moderation_workflow_functions_28 (
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
create index if not exists idx_moderation_workflow_functions_28_tenant_status on public.moderation_workflow_functions_28(tenant_id, status);
create index if not exists idx_moderation_workflow_functions_28_payload_gin on public.moderation_workflow_functions_28 using gin(payload);
alter table public.moderation_workflow_functions_28 enable row level security;
drop policy if exists moderation_workflow_functions_28_service_role_all on public.moderation_workflow_functions_28;
create policy moderation_workflow_functions_28_service_role_all on public.moderation_workflow_functions_28 for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');

create table if not exists public.moderation_workflow_functions_29 (
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
create index if not exists idx_moderation_workflow_functions_29_tenant_status on public.moderation_workflow_functions_29(tenant_id, status);
create index if not exists idx_moderation_workflow_functions_29_payload_gin on public.moderation_workflow_functions_29 using gin(payload);
alter table public.moderation_workflow_functions_29 enable row level security;
drop policy if exists moderation_workflow_functions_29_service_role_all on public.moderation_workflow_functions_29;
create policy moderation_workflow_functions_29_service_role_all on public.moderation_workflow_functions_29 for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');

create table if not exists public.moderation_workflow_functions_30 (
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
create index if not exists idx_moderation_workflow_functions_30_tenant_status on public.moderation_workflow_functions_30(tenant_id, status);
create index if not exists idx_moderation_workflow_functions_30_payload_gin on public.moderation_workflow_functions_30 using gin(payload);
alter table public.moderation_workflow_functions_30 enable row level security;
drop policy if exists moderation_workflow_functions_30_service_role_all on public.moderation_workflow_functions_30;
create policy moderation_workflow_functions_30_service_role_all on public.moderation_workflow_functions_30 for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');

create table if not exists public.moderation_workflow_functions_31 (
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
create index if not exists idx_moderation_workflow_functions_31_tenant_status on public.moderation_workflow_functions_31(tenant_id, status);
create index if not exists idx_moderation_workflow_functions_31_payload_gin on public.moderation_workflow_functions_31 using gin(payload);
alter table public.moderation_workflow_functions_31 enable row level security;
drop policy if exists moderation_workflow_functions_31_service_role_all on public.moderation_workflow_functions_31;
create policy moderation_workflow_functions_31_service_role_all on public.moderation_workflow_functions_31 for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');

create table if not exists public.moderation_workflow_functions_32 (
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
create index if not exists idx_moderation_workflow_functions_32_tenant_status on public.moderation_workflow_functions_32(tenant_id, status);
create index if not exists idx_moderation_workflow_functions_32_payload_gin on public.moderation_workflow_functions_32 using gin(payload);
alter table public.moderation_workflow_functions_32 enable row level security;
drop policy if exists moderation_workflow_functions_32_service_role_all on public.moderation_workflow_functions_32;
create policy moderation_workflow_functions_32_service_role_all on public.moderation_workflow_functions_32 for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');

create table if not exists public.moderation_workflow_functions_33 (
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
create index if not exists idx_moderation_workflow_functions_33_tenant_status on public.moderation_workflow_functions_33(tenant_id, status);
create index if not exists idx_moderation_workflow_functions_33_payload_gin on public.moderation_workflow_functions_33 using gin(payload);
alter table public.moderation_workflow_functions_33 enable row level security;
drop policy if exists moderation_workflow_functions_33_service_role_all on public.moderation_workflow_functions_33;
create policy moderation_workflow_functions_33_service_role_all on public.moderation_workflow_functions_33 for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');

create table if not exists public.moderation_workflow_functions_34 (
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
create index if not exists idx_moderation_workflow_functions_34_tenant_status on public.moderation_workflow_functions_34(tenant_id, status);
create index if not exists idx_moderation_workflow_functions_34_payload_gin on public.moderation_workflow_functions_34 using gin(payload);
alter table public.moderation_workflow_functions_34 enable row level security;
drop policy if exists moderation_workflow_functions_34_service_role_all on public.moderation_workflow_functions_34;
create policy moderation_workflow_functions_34_service_role_all on public.moderation_workflow_functions_34 for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');

create table if not exists public.moderation_workflow_functions_35 (
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
create index if not exists idx_moderation_workflow_functions_35_tenant_status on public.moderation_workflow_functions_35(tenant_id, status);
create index if not exists idx_moderation_workflow_functions_35_payload_gin on public.moderation_workflow_functions_35 using gin(payload);
alter table public.moderation_workflow_functions_35 enable row level security;
drop policy if exists moderation_workflow_functions_35_service_role_all on public.moderation_workflow_functions_35;
create policy moderation_workflow_functions_35_service_role_all on public.moderation_workflow_functions_35 for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');
