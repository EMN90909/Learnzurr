-- 185_rls_policy_matrix.sql
-- Learnzur production migration layer with concrete tables, views, policies and operational contracts.

create table if not exists public.rls_policy_matrix_01 (
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
create index if not exists idx_rls_policy_matrix_01_tenant_status on public.rls_policy_matrix_01(tenant_id, status);
create index if not exists idx_rls_policy_matrix_01_payload_gin on public.rls_policy_matrix_01 using gin(payload);
alter table public.rls_policy_matrix_01 enable row level security;
drop policy if exists rls_policy_matrix_01_service_role_all on public.rls_policy_matrix_01;
create policy rls_policy_matrix_01_service_role_all on public.rls_policy_matrix_01 for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');

create table if not exists public.rls_policy_matrix_02 (
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
create index if not exists idx_rls_policy_matrix_02_tenant_status on public.rls_policy_matrix_02(tenant_id, status);
create index if not exists idx_rls_policy_matrix_02_payload_gin on public.rls_policy_matrix_02 using gin(payload);
alter table public.rls_policy_matrix_02 enable row level security;
drop policy if exists rls_policy_matrix_02_service_role_all on public.rls_policy_matrix_02;
create policy rls_policy_matrix_02_service_role_all on public.rls_policy_matrix_02 for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');

create table if not exists public.rls_policy_matrix_03 (
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
create index if not exists idx_rls_policy_matrix_03_tenant_status on public.rls_policy_matrix_03(tenant_id, status);
create index if not exists idx_rls_policy_matrix_03_payload_gin on public.rls_policy_matrix_03 using gin(payload);
alter table public.rls_policy_matrix_03 enable row level security;
drop policy if exists rls_policy_matrix_03_service_role_all on public.rls_policy_matrix_03;
create policy rls_policy_matrix_03_service_role_all on public.rls_policy_matrix_03 for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');

create table if not exists public.rls_policy_matrix_04 (
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
create index if not exists idx_rls_policy_matrix_04_tenant_status on public.rls_policy_matrix_04(tenant_id, status);
create index if not exists idx_rls_policy_matrix_04_payload_gin on public.rls_policy_matrix_04 using gin(payload);
alter table public.rls_policy_matrix_04 enable row level security;
drop policy if exists rls_policy_matrix_04_service_role_all on public.rls_policy_matrix_04;
create policy rls_policy_matrix_04_service_role_all on public.rls_policy_matrix_04 for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');

create table if not exists public.rls_policy_matrix_05 (
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
create index if not exists idx_rls_policy_matrix_05_tenant_status on public.rls_policy_matrix_05(tenant_id, status);
create index if not exists idx_rls_policy_matrix_05_payload_gin on public.rls_policy_matrix_05 using gin(payload);
alter table public.rls_policy_matrix_05 enable row level security;
drop policy if exists rls_policy_matrix_05_service_role_all on public.rls_policy_matrix_05;
create policy rls_policy_matrix_05_service_role_all on public.rls_policy_matrix_05 for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');

create table if not exists public.rls_policy_matrix_06 (
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
create index if not exists idx_rls_policy_matrix_06_tenant_status on public.rls_policy_matrix_06(tenant_id, status);
create index if not exists idx_rls_policy_matrix_06_payload_gin on public.rls_policy_matrix_06 using gin(payload);
alter table public.rls_policy_matrix_06 enable row level security;
drop policy if exists rls_policy_matrix_06_service_role_all on public.rls_policy_matrix_06;
create policy rls_policy_matrix_06_service_role_all on public.rls_policy_matrix_06 for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');

create table if not exists public.rls_policy_matrix_07 (
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
create index if not exists idx_rls_policy_matrix_07_tenant_status on public.rls_policy_matrix_07(tenant_id, status);
create index if not exists idx_rls_policy_matrix_07_payload_gin on public.rls_policy_matrix_07 using gin(payload);
alter table public.rls_policy_matrix_07 enable row level security;
drop policy if exists rls_policy_matrix_07_service_role_all on public.rls_policy_matrix_07;
create policy rls_policy_matrix_07_service_role_all on public.rls_policy_matrix_07 for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');

create table if not exists public.rls_policy_matrix_08 (
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
create index if not exists idx_rls_policy_matrix_08_tenant_status on public.rls_policy_matrix_08(tenant_id, status);
create index if not exists idx_rls_policy_matrix_08_payload_gin on public.rls_policy_matrix_08 using gin(payload);
alter table public.rls_policy_matrix_08 enable row level security;
drop policy if exists rls_policy_matrix_08_service_role_all on public.rls_policy_matrix_08;
create policy rls_policy_matrix_08_service_role_all on public.rls_policy_matrix_08 for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');

create table if not exists public.rls_policy_matrix_09 (
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
create index if not exists idx_rls_policy_matrix_09_tenant_status on public.rls_policy_matrix_09(tenant_id, status);
create index if not exists idx_rls_policy_matrix_09_payload_gin on public.rls_policy_matrix_09 using gin(payload);
alter table public.rls_policy_matrix_09 enable row level security;
drop policy if exists rls_policy_matrix_09_service_role_all on public.rls_policy_matrix_09;
create policy rls_policy_matrix_09_service_role_all on public.rls_policy_matrix_09 for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');

create table if not exists public.rls_policy_matrix_10 (
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
create index if not exists idx_rls_policy_matrix_10_tenant_status on public.rls_policy_matrix_10(tenant_id, status);
create index if not exists idx_rls_policy_matrix_10_payload_gin on public.rls_policy_matrix_10 using gin(payload);
alter table public.rls_policy_matrix_10 enable row level security;
drop policy if exists rls_policy_matrix_10_service_role_all on public.rls_policy_matrix_10;
create policy rls_policy_matrix_10_service_role_all on public.rls_policy_matrix_10 for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');

create table if not exists public.rls_policy_matrix_11 (
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
create index if not exists idx_rls_policy_matrix_11_tenant_status on public.rls_policy_matrix_11(tenant_id, status);
create index if not exists idx_rls_policy_matrix_11_payload_gin on public.rls_policy_matrix_11 using gin(payload);
alter table public.rls_policy_matrix_11 enable row level security;
drop policy if exists rls_policy_matrix_11_service_role_all on public.rls_policy_matrix_11;
create policy rls_policy_matrix_11_service_role_all on public.rls_policy_matrix_11 for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');

create table if not exists public.rls_policy_matrix_12 (
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
create index if not exists idx_rls_policy_matrix_12_tenant_status on public.rls_policy_matrix_12(tenant_id, status);
create index if not exists idx_rls_policy_matrix_12_payload_gin on public.rls_policy_matrix_12 using gin(payload);
alter table public.rls_policy_matrix_12 enable row level security;
drop policy if exists rls_policy_matrix_12_service_role_all on public.rls_policy_matrix_12;
create policy rls_policy_matrix_12_service_role_all on public.rls_policy_matrix_12 for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');

create table if not exists public.rls_policy_matrix_13 (
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
create index if not exists idx_rls_policy_matrix_13_tenant_status on public.rls_policy_matrix_13(tenant_id, status);
create index if not exists idx_rls_policy_matrix_13_payload_gin on public.rls_policy_matrix_13 using gin(payload);
alter table public.rls_policy_matrix_13 enable row level security;
drop policy if exists rls_policy_matrix_13_service_role_all on public.rls_policy_matrix_13;
create policy rls_policy_matrix_13_service_role_all on public.rls_policy_matrix_13 for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');

create table if not exists public.rls_policy_matrix_14 (
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
create index if not exists idx_rls_policy_matrix_14_tenant_status on public.rls_policy_matrix_14(tenant_id, status);
create index if not exists idx_rls_policy_matrix_14_payload_gin on public.rls_policy_matrix_14 using gin(payload);
alter table public.rls_policy_matrix_14 enable row level security;
drop policy if exists rls_policy_matrix_14_service_role_all on public.rls_policy_matrix_14;
create policy rls_policy_matrix_14_service_role_all on public.rls_policy_matrix_14 for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');

create table if not exists public.rls_policy_matrix_15 (
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
create index if not exists idx_rls_policy_matrix_15_tenant_status on public.rls_policy_matrix_15(tenant_id, status);
create index if not exists idx_rls_policy_matrix_15_payload_gin on public.rls_policy_matrix_15 using gin(payload);
alter table public.rls_policy_matrix_15 enable row level security;
drop policy if exists rls_policy_matrix_15_service_role_all on public.rls_policy_matrix_15;
create policy rls_policy_matrix_15_service_role_all on public.rls_policy_matrix_15 for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');

create table if not exists public.rls_policy_matrix_16 (
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
create index if not exists idx_rls_policy_matrix_16_tenant_status on public.rls_policy_matrix_16(tenant_id, status);
create index if not exists idx_rls_policy_matrix_16_payload_gin on public.rls_policy_matrix_16 using gin(payload);
alter table public.rls_policy_matrix_16 enable row level security;
drop policy if exists rls_policy_matrix_16_service_role_all on public.rls_policy_matrix_16;
create policy rls_policy_matrix_16_service_role_all on public.rls_policy_matrix_16 for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');

create table if not exists public.rls_policy_matrix_17 (
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
create index if not exists idx_rls_policy_matrix_17_tenant_status on public.rls_policy_matrix_17(tenant_id, status);
create index if not exists idx_rls_policy_matrix_17_payload_gin on public.rls_policy_matrix_17 using gin(payload);
alter table public.rls_policy_matrix_17 enable row level security;
drop policy if exists rls_policy_matrix_17_service_role_all on public.rls_policy_matrix_17;
create policy rls_policy_matrix_17_service_role_all on public.rls_policy_matrix_17 for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');

create table if not exists public.rls_policy_matrix_18 (
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
create index if not exists idx_rls_policy_matrix_18_tenant_status on public.rls_policy_matrix_18(tenant_id, status);
create index if not exists idx_rls_policy_matrix_18_payload_gin on public.rls_policy_matrix_18 using gin(payload);
alter table public.rls_policy_matrix_18 enable row level security;
drop policy if exists rls_policy_matrix_18_service_role_all on public.rls_policy_matrix_18;
create policy rls_policy_matrix_18_service_role_all on public.rls_policy_matrix_18 for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');

create table if not exists public.rls_policy_matrix_19 (
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
create index if not exists idx_rls_policy_matrix_19_tenant_status on public.rls_policy_matrix_19(tenant_id, status);
create index if not exists idx_rls_policy_matrix_19_payload_gin on public.rls_policy_matrix_19 using gin(payload);
alter table public.rls_policy_matrix_19 enable row level security;
drop policy if exists rls_policy_matrix_19_service_role_all on public.rls_policy_matrix_19;
create policy rls_policy_matrix_19_service_role_all on public.rls_policy_matrix_19 for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');

create table if not exists public.rls_policy_matrix_20 (
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
create index if not exists idx_rls_policy_matrix_20_tenant_status on public.rls_policy_matrix_20(tenant_id, status);
create index if not exists idx_rls_policy_matrix_20_payload_gin on public.rls_policy_matrix_20 using gin(payload);
alter table public.rls_policy_matrix_20 enable row level security;
drop policy if exists rls_policy_matrix_20_service_role_all on public.rls_policy_matrix_20;
create policy rls_policy_matrix_20_service_role_all on public.rls_policy_matrix_20 for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');

create table if not exists public.rls_policy_matrix_21 (
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
create index if not exists idx_rls_policy_matrix_21_tenant_status on public.rls_policy_matrix_21(tenant_id, status);
create index if not exists idx_rls_policy_matrix_21_payload_gin on public.rls_policy_matrix_21 using gin(payload);
alter table public.rls_policy_matrix_21 enable row level security;
drop policy if exists rls_policy_matrix_21_service_role_all on public.rls_policy_matrix_21;
create policy rls_policy_matrix_21_service_role_all on public.rls_policy_matrix_21 for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');

create table if not exists public.rls_policy_matrix_22 (
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
create index if not exists idx_rls_policy_matrix_22_tenant_status on public.rls_policy_matrix_22(tenant_id, status);
create index if not exists idx_rls_policy_matrix_22_payload_gin on public.rls_policy_matrix_22 using gin(payload);
alter table public.rls_policy_matrix_22 enable row level security;
drop policy if exists rls_policy_matrix_22_service_role_all on public.rls_policy_matrix_22;
create policy rls_policy_matrix_22_service_role_all on public.rls_policy_matrix_22 for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');

create table if not exists public.rls_policy_matrix_23 (
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
create index if not exists idx_rls_policy_matrix_23_tenant_status on public.rls_policy_matrix_23(tenant_id, status);
create index if not exists idx_rls_policy_matrix_23_payload_gin on public.rls_policy_matrix_23 using gin(payload);
alter table public.rls_policy_matrix_23 enable row level security;
drop policy if exists rls_policy_matrix_23_service_role_all on public.rls_policy_matrix_23;
create policy rls_policy_matrix_23_service_role_all on public.rls_policy_matrix_23 for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');

create table if not exists public.rls_policy_matrix_24 (
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
create index if not exists idx_rls_policy_matrix_24_tenant_status on public.rls_policy_matrix_24(tenant_id, status);
create index if not exists idx_rls_policy_matrix_24_payload_gin on public.rls_policy_matrix_24 using gin(payload);
alter table public.rls_policy_matrix_24 enable row level security;
drop policy if exists rls_policy_matrix_24_service_role_all on public.rls_policy_matrix_24;
create policy rls_policy_matrix_24_service_role_all on public.rls_policy_matrix_24 for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');

create table if not exists public.rls_policy_matrix_25 (
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
create index if not exists idx_rls_policy_matrix_25_tenant_status on public.rls_policy_matrix_25(tenant_id, status);
create index if not exists idx_rls_policy_matrix_25_payload_gin on public.rls_policy_matrix_25 using gin(payload);
alter table public.rls_policy_matrix_25 enable row level security;
drop policy if exists rls_policy_matrix_25_service_role_all on public.rls_policy_matrix_25;
create policy rls_policy_matrix_25_service_role_all on public.rls_policy_matrix_25 for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');

create table if not exists public.rls_policy_matrix_26 (
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
create index if not exists idx_rls_policy_matrix_26_tenant_status on public.rls_policy_matrix_26(tenant_id, status);
create index if not exists idx_rls_policy_matrix_26_payload_gin on public.rls_policy_matrix_26 using gin(payload);
alter table public.rls_policy_matrix_26 enable row level security;
drop policy if exists rls_policy_matrix_26_service_role_all on public.rls_policy_matrix_26;
create policy rls_policy_matrix_26_service_role_all on public.rls_policy_matrix_26 for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');

create table if not exists public.rls_policy_matrix_27 (
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
create index if not exists idx_rls_policy_matrix_27_tenant_status on public.rls_policy_matrix_27(tenant_id, status);
create index if not exists idx_rls_policy_matrix_27_payload_gin on public.rls_policy_matrix_27 using gin(payload);
alter table public.rls_policy_matrix_27 enable row level security;
drop policy if exists rls_policy_matrix_27_service_role_all on public.rls_policy_matrix_27;
create policy rls_policy_matrix_27_service_role_all on public.rls_policy_matrix_27 for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');

create table if not exists public.rls_policy_matrix_28 (
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
create index if not exists idx_rls_policy_matrix_28_tenant_status on public.rls_policy_matrix_28(tenant_id, status);
create index if not exists idx_rls_policy_matrix_28_payload_gin on public.rls_policy_matrix_28 using gin(payload);
alter table public.rls_policy_matrix_28 enable row level security;
drop policy if exists rls_policy_matrix_28_service_role_all on public.rls_policy_matrix_28;
create policy rls_policy_matrix_28_service_role_all on public.rls_policy_matrix_28 for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');

create table if not exists public.rls_policy_matrix_29 (
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
create index if not exists idx_rls_policy_matrix_29_tenant_status on public.rls_policy_matrix_29(tenant_id, status);
create index if not exists idx_rls_policy_matrix_29_payload_gin on public.rls_policy_matrix_29 using gin(payload);
alter table public.rls_policy_matrix_29 enable row level security;
drop policy if exists rls_policy_matrix_29_service_role_all on public.rls_policy_matrix_29;
create policy rls_policy_matrix_29_service_role_all on public.rls_policy_matrix_29 for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');

create table if not exists public.rls_policy_matrix_30 (
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
create index if not exists idx_rls_policy_matrix_30_tenant_status on public.rls_policy_matrix_30(tenant_id, status);
create index if not exists idx_rls_policy_matrix_30_payload_gin on public.rls_policy_matrix_30 using gin(payload);
alter table public.rls_policy_matrix_30 enable row level security;
drop policy if exists rls_policy_matrix_30_service_role_all on public.rls_policy_matrix_30;
create policy rls_policy_matrix_30_service_role_all on public.rls_policy_matrix_30 for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');

create table if not exists public.rls_policy_matrix_31 (
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
create index if not exists idx_rls_policy_matrix_31_tenant_status on public.rls_policy_matrix_31(tenant_id, status);
create index if not exists idx_rls_policy_matrix_31_payload_gin on public.rls_policy_matrix_31 using gin(payload);
alter table public.rls_policy_matrix_31 enable row level security;
drop policy if exists rls_policy_matrix_31_service_role_all on public.rls_policy_matrix_31;
create policy rls_policy_matrix_31_service_role_all on public.rls_policy_matrix_31 for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');

create table if not exists public.rls_policy_matrix_32 (
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
create index if not exists idx_rls_policy_matrix_32_tenant_status on public.rls_policy_matrix_32(tenant_id, status);
create index if not exists idx_rls_policy_matrix_32_payload_gin on public.rls_policy_matrix_32 using gin(payload);
alter table public.rls_policy_matrix_32 enable row level security;
drop policy if exists rls_policy_matrix_32_service_role_all on public.rls_policy_matrix_32;
create policy rls_policy_matrix_32_service_role_all on public.rls_policy_matrix_32 for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');

create table if not exists public.rls_policy_matrix_33 (
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
create index if not exists idx_rls_policy_matrix_33_tenant_status on public.rls_policy_matrix_33(tenant_id, status);
create index if not exists idx_rls_policy_matrix_33_payload_gin on public.rls_policy_matrix_33 using gin(payload);
alter table public.rls_policy_matrix_33 enable row level security;
drop policy if exists rls_policy_matrix_33_service_role_all on public.rls_policy_matrix_33;
create policy rls_policy_matrix_33_service_role_all on public.rls_policy_matrix_33 for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');

create table if not exists public.rls_policy_matrix_34 (
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
create index if not exists idx_rls_policy_matrix_34_tenant_status on public.rls_policy_matrix_34(tenant_id, status);
create index if not exists idx_rls_policy_matrix_34_payload_gin on public.rls_policy_matrix_34 using gin(payload);
alter table public.rls_policy_matrix_34 enable row level security;
drop policy if exists rls_policy_matrix_34_service_role_all on public.rls_policy_matrix_34;
create policy rls_policy_matrix_34_service_role_all on public.rls_policy_matrix_34 for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');

create table if not exists public.rls_policy_matrix_35 (
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
create index if not exists idx_rls_policy_matrix_35_tenant_status on public.rls_policy_matrix_35(tenant_id, status);
create index if not exists idx_rls_policy_matrix_35_payload_gin on public.rls_policy_matrix_35 using gin(payload);
alter table public.rls_policy_matrix_35 enable row level security;
drop policy if exists rls_policy_matrix_35_service_role_all on public.rls_policy_matrix_35;
create policy rls_policy_matrix_35_service_role_all on public.rls_policy_matrix_35 for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');
