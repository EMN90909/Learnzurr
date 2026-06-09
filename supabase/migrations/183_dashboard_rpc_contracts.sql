-- 183_dashboard_rpc_contracts.sql
-- Learnzur production migration layer with concrete tables, views, policies and operational contracts.

create table if not exists public.dashboard_rpc_contracts_01 (
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
create index if not exists idx_dashboard_rpc_contracts_01_tenant_status on public.dashboard_rpc_contracts_01(tenant_id, status);
create index if not exists idx_dashboard_rpc_contracts_01_payload_gin on public.dashboard_rpc_contracts_01 using gin(payload);
alter table public.dashboard_rpc_contracts_01 enable row level security;
drop policy if exists dashboard_rpc_contracts_01_service_role_all on public.dashboard_rpc_contracts_01;
create policy dashboard_rpc_contracts_01_service_role_all on public.dashboard_rpc_contracts_01 for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');

create table if not exists public.dashboard_rpc_contracts_02 (
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
create index if not exists idx_dashboard_rpc_contracts_02_tenant_status on public.dashboard_rpc_contracts_02(tenant_id, status);
create index if not exists idx_dashboard_rpc_contracts_02_payload_gin on public.dashboard_rpc_contracts_02 using gin(payload);
alter table public.dashboard_rpc_contracts_02 enable row level security;
drop policy if exists dashboard_rpc_contracts_02_service_role_all on public.dashboard_rpc_contracts_02;
create policy dashboard_rpc_contracts_02_service_role_all on public.dashboard_rpc_contracts_02 for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');

create table if not exists public.dashboard_rpc_contracts_03 (
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
create index if not exists idx_dashboard_rpc_contracts_03_tenant_status on public.dashboard_rpc_contracts_03(tenant_id, status);
create index if not exists idx_dashboard_rpc_contracts_03_payload_gin on public.dashboard_rpc_contracts_03 using gin(payload);
alter table public.dashboard_rpc_contracts_03 enable row level security;
drop policy if exists dashboard_rpc_contracts_03_service_role_all on public.dashboard_rpc_contracts_03;
create policy dashboard_rpc_contracts_03_service_role_all on public.dashboard_rpc_contracts_03 for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');

create table if not exists public.dashboard_rpc_contracts_04 (
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
create index if not exists idx_dashboard_rpc_contracts_04_tenant_status on public.dashboard_rpc_contracts_04(tenant_id, status);
create index if not exists idx_dashboard_rpc_contracts_04_payload_gin on public.dashboard_rpc_contracts_04 using gin(payload);
alter table public.dashboard_rpc_contracts_04 enable row level security;
drop policy if exists dashboard_rpc_contracts_04_service_role_all on public.dashboard_rpc_contracts_04;
create policy dashboard_rpc_contracts_04_service_role_all on public.dashboard_rpc_contracts_04 for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');

create table if not exists public.dashboard_rpc_contracts_05 (
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
create index if not exists idx_dashboard_rpc_contracts_05_tenant_status on public.dashboard_rpc_contracts_05(tenant_id, status);
create index if not exists idx_dashboard_rpc_contracts_05_payload_gin on public.dashboard_rpc_contracts_05 using gin(payload);
alter table public.dashboard_rpc_contracts_05 enable row level security;
drop policy if exists dashboard_rpc_contracts_05_service_role_all on public.dashboard_rpc_contracts_05;
create policy dashboard_rpc_contracts_05_service_role_all on public.dashboard_rpc_contracts_05 for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');

create table if not exists public.dashboard_rpc_contracts_06 (
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
create index if not exists idx_dashboard_rpc_contracts_06_tenant_status on public.dashboard_rpc_contracts_06(tenant_id, status);
create index if not exists idx_dashboard_rpc_contracts_06_payload_gin on public.dashboard_rpc_contracts_06 using gin(payload);
alter table public.dashboard_rpc_contracts_06 enable row level security;
drop policy if exists dashboard_rpc_contracts_06_service_role_all on public.dashboard_rpc_contracts_06;
create policy dashboard_rpc_contracts_06_service_role_all on public.dashboard_rpc_contracts_06 for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');

create table if not exists public.dashboard_rpc_contracts_07 (
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
create index if not exists idx_dashboard_rpc_contracts_07_tenant_status on public.dashboard_rpc_contracts_07(tenant_id, status);
create index if not exists idx_dashboard_rpc_contracts_07_payload_gin on public.dashboard_rpc_contracts_07 using gin(payload);
alter table public.dashboard_rpc_contracts_07 enable row level security;
drop policy if exists dashboard_rpc_contracts_07_service_role_all on public.dashboard_rpc_contracts_07;
create policy dashboard_rpc_contracts_07_service_role_all on public.dashboard_rpc_contracts_07 for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');

create table if not exists public.dashboard_rpc_contracts_08 (
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
create index if not exists idx_dashboard_rpc_contracts_08_tenant_status on public.dashboard_rpc_contracts_08(tenant_id, status);
create index if not exists idx_dashboard_rpc_contracts_08_payload_gin on public.dashboard_rpc_contracts_08 using gin(payload);
alter table public.dashboard_rpc_contracts_08 enable row level security;
drop policy if exists dashboard_rpc_contracts_08_service_role_all on public.dashboard_rpc_contracts_08;
create policy dashboard_rpc_contracts_08_service_role_all on public.dashboard_rpc_contracts_08 for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');

create table if not exists public.dashboard_rpc_contracts_09 (
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
create index if not exists idx_dashboard_rpc_contracts_09_tenant_status on public.dashboard_rpc_contracts_09(tenant_id, status);
create index if not exists idx_dashboard_rpc_contracts_09_payload_gin on public.dashboard_rpc_contracts_09 using gin(payload);
alter table public.dashboard_rpc_contracts_09 enable row level security;
drop policy if exists dashboard_rpc_contracts_09_service_role_all on public.dashboard_rpc_contracts_09;
create policy dashboard_rpc_contracts_09_service_role_all on public.dashboard_rpc_contracts_09 for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');

create table if not exists public.dashboard_rpc_contracts_10 (
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
create index if not exists idx_dashboard_rpc_contracts_10_tenant_status on public.dashboard_rpc_contracts_10(tenant_id, status);
create index if not exists idx_dashboard_rpc_contracts_10_payload_gin on public.dashboard_rpc_contracts_10 using gin(payload);
alter table public.dashboard_rpc_contracts_10 enable row level security;
drop policy if exists dashboard_rpc_contracts_10_service_role_all on public.dashboard_rpc_contracts_10;
create policy dashboard_rpc_contracts_10_service_role_all on public.dashboard_rpc_contracts_10 for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');

create table if not exists public.dashboard_rpc_contracts_11 (
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
create index if not exists idx_dashboard_rpc_contracts_11_tenant_status on public.dashboard_rpc_contracts_11(tenant_id, status);
create index if not exists idx_dashboard_rpc_contracts_11_payload_gin on public.dashboard_rpc_contracts_11 using gin(payload);
alter table public.dashboard_rpc_contracts_11 enable row level security;
drop policy if exists dashboard_rpc_contracts_11_service_role_all on public.dashboard_rpc_contracts_11;
create policy dashboard_rpc_contracts_11_service_role_all on public.dashboard_rpc_contracts_11 for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');

create table if not exists public.dashboard_rpc_contracts_12 (
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
create index if not exists idx_dashboard_rpc_contracts_12_tenant_status on public.dashboard_rpc_contracts_12(tenant_id, status);
create index if not exists idx_dashboard_rpc_contracts_12_payload_gin on public.dashboard_rpc_contracts_12 using gin(payload);
alter table public.dashboard_rpc_contracts_12 enable row level security;
drop policy if exists dashboard_rpc_contracts_12_service_role_all on public.dashboard_rpc_contracts_12;
create policy dashboard_rpc_contracts_12_service_role_all on public.dashboard_rpc_contracts_12 for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');

create table if not exists public.dashboard_rpc_contracts_13 (
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
create index if not exists idx_dashboard_rpc_contracts_13_tenant_status on public.dashboard_rpc_contracts_13(tenant_id, status);
create index if not exists idx_dashboard_rpc_contracts_13_payload_gin on public.dashboard_rpc_contracts_13 using gin(payload);
alter table public.dashboard_rpc_contracts_13 enable row level security;
drop policy if exists dashboard_rpc_contracts_13_service_role_all on public.dashboard_rpc_contracts_13;
create policy dashboard_rpc_contracts_13_service_role_all on public.dashboard_rpc_contracts_13 for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');

create table if not exists public.dashboard_rpc_contracts_14 (
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
create index if not exists idx_dashboard_rpc_contracts_14_tenant_status on public.dashboard_rpc_contracts_14(tenant_id, status);
create index if not exists idx_dashboard_rpc_contracts_14_payload_gin on public.dashboard_rpc_contracts_14 using gin(payload);
alter table public.dashboard_rpc_contracts_14 enable row level security;
drop policy if exists dashboard_rpc_contracts_14_service_role_all on public.dashboard_rpc_contracts_14;
create policy dashboard_rpc_contracts_14_service_role_all on public.dashboard_rpc_contracts_14 for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');

create table if not exists public.dashboard_rpc_contracts_15 (
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
create index if not exists idx_dashboard_rpc_contracts_15_tenant_status on public.dashboard_rpc_contracts_15(tenant_id, status);
create index if not exists idx_dashboard_rpc_contracts_15_payload_gin on public.dashboard_rpc_contracts_15 using gin(payload);
alter table public.dashboard_rpc_contracts_15 enable row level security;
drop policy if exists dashboard_rpc_contracts_15_service_role_all on public.dashboard_rpc_contracts_15;
create policy dashboard_rpc_contracts_15_service_role_all on public.dashboard_rpc_contracts_15 for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');

create table if not exists public.dashboard_rpc_contracts_16 (
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
create index if not exists idx_dashboard_rpc_contracts_16_tenant_status on public.dashboard_rpc_contracts_16(tenant_id, status);
create index if not exists idx_dashboard_rpc_contracts_16_payload_gin on public.dashboard_rpc_contracts_16 using gin(payload);
alter table public.dashboard_rpc_contracts_16 enable row level security;
drop policy if exists dashboard_rpc_contracts_16_service_role_all on public.dashboard_rpc_contracts_16;
create policy dashboard_rpc_contracts_16_service_role_all on public.dashboard_rpc_contracts_16 for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');

create table if not exists public.dashboard_rpc_contracts_17 (
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
create index if not exists idx_dashboard_rpc_contracts_17_tenant_status on public.dashboard_rpc_contracts_17(tenant_id, status);
create index if not exists idx_dashboard_rpc_contracts_17_payload_gin on public.dashboard_rpc_contracts_17 using gin(payload);
alter table public.dashboard_rpc_contracts_17 enable row level security;
drop policy if exists dashboard_rpc_contracts_17_service_role_all on public.dashboard_rpc_contracts_17;
create policy dashboard_rpc_contracts_17_service_role_all on public.dashboard_rpc_contracts_17 for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');

create table if not exists public.dashboard_rpc_contracts_18 (
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
create index if not exists idx_dashboard_rpc_contracts_18_tenant_status on public.dashboard_rpc_contracts_18(tenant_id, status);
create index if not exists idx_dashboard_rpc_contracts_18_payload_gin on public.dashboard_rpc_contracts_18 using gin(payload);
alter table public.dashboard_rpc_contracts_18 enable row level security;
drop policy if exists dashboard_rpc_contracts_18_service_role_all on public.dashboard_rpc_contracts_18;
create policy dashboard_rpc_contracts_18_service_role_all on public.dashboard_rpc_contracts_18 for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');

create table if not exists public.dashboard_rpc_contracts_19 (
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
create index if not exists idx_dashboard_rpc_contracts_19_tenant_status on public.dashboard_rpc_contracts_19(tenant_id, status);
create index if not exists idx_dashboard_rpc_contracts_19_payload_gin on public.dashboard_rpc_contracts_19 using gin(payload);
alter table public.dashboard_rpc_contracts_19 enable row level security;
drop policy if exists dashboard_rpc_contracts_19_service_role_all on public.dashboard_rpc_contracts_19;
create policy dashboard_rpc_contracts_19_service_role_all on public.dashboard_rpc_contracts_19 for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');

create table if not exists public.dashboard_rpc_contracts_20 (
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
create index if not exists idx_dashboard_rpc_contracts_20_tenant_status on public.dashboard_rpc_contracts_20(tenant_id, status);
create index if not exists idx_dashboard_rpc_contracts_20_payload_gin on public.dashboard_rpc_contracts_20 using gin(payload);
alter table public.dashboard_rpc_contracts_20 enable row level security;
drop policy if exists dashboard_rpc_contracts_20_service_role_all on public.dashboard_rpc_contracts_20;
create policy dashboard_rpc_contracts_20_service_role_all on public.dashboard_rpc_contracts_20 for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');

create table if not exists public.dashboard_rpc_contracts_21 (
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
create index if not exists idx_dashboard_rpc_contracts_21_tenant_status on public.dashboard_rpc_contracts_21(tenant_id, status);
create index if not exists idx_dashboard_rpc_contracts_21_payload_gin on public.dashboard_rpc_contracts_21 using gin(payload);
alter table public.dashboard_rpc_contracts_21 enable row level security;
drop policy if exists dashboard_rpc_contracts_21_service_role_all on public.dashboard_rpc_contracts_21;
create policy dashboard_rpc_contracts_21_service_role_all on public.dashboard_rpc_contracts_21 for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');

create table if not exists public.dashboard_rpc_contracts_22 (
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
create index if not exists idx_dashboard_rpc_contracts_22_tenant_status on public.dashboard_rpc_contracts_22(tenant_id, status);
create index if not exists idx_dashboard_rpc_contracts_22_payload_gin on public.dashboard_rpc_contracts_22 using gin(payload);
alter table public.dashboard_rpc_contracts_22 enable row level security;
drop policy if exists dashboard_rpc_contracts_22_service_role_all on public.dashboard_rpc_contracts_22;
create policy dashboard_rpc_contracts_22_service_role_all on public.dashboard_rpc_contracts_22 for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');

create table if not exists public.dashboard_rpc_contracts_23 (
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
create index if not exists idx_dashboard_rpc_contracts_23_tenant_status on public.dashboard_rpc_contracts_23(tenant_id, status);
create index if not exists idx_dashboard_rpc_contracts_23_payload_gin on public.dashboard_rpc_contracts_23 using gin(payload);
alter table public.dashboard_rpc_contracts_23 enable row level security;
drop policy if exists dashboard_rpc_contracts_23_service_role_all on public.dashboard_rpc_contracts_23;
create policy dashboard_rpc_contracts_23_service_role_all on public.dashboard_rpc_contracts_23 for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');

create table if not exists public.dashboard_rpc_contracts_24 (
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
create index if not exists idx_dashboard_rpc_contracts_24_tenant_status on public.dashboard_rpc_contracts_24(tenant_id, status);
create index if not exists idx_dashboard_rpc_contracts_24_payload_gin on public.dashboard_rpc_contracts_24 using gin(payload);
alter table public.dashboard_rpc_contracts_24 enable row level security;
drop policy if exists dashboard_rpc_contracts_24_service_role_all on public.dashboard_rpc_contracts_24;
create policy dashboard_rpc_contracts_24_service_role_all on public.dashboard_rpc_contracts_24 for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');

create table if not exists public.dashboard_rpc_contracts_25 (
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
create index if not exists idx_dashboard_rpc_contracts_25_tenant_status on public.dashboard_rpc_contracts_25(tenant_id, status);
create index if not exists idx_dashboard_rpc_contracts_25_payload_gin on public.dashboard_rpc_contracts_25 using gin(payload);
alter table public.dashboard_rpc_contracts_25 enable row level security;
drop policy if exists dashboard_rpc_contracts_25_service_role_all on public.dashboard_rpc_contracts_25;
create policy dashboard_rpc_contracts_25_service_role_all on public.dashboard_rpc_contracts_25 for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');

create table if not exists public.dashboard_rpc_contracts_26 (
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
create index if not exists idx_dashboard_rpc_contracts_26_tenant_status on public.dashboard_rpc_contracts_26(tenant_id, status);
create index if not exists idx_dashboard_rpc_contracts_26_payload_gin on public.dashboard_rpc_contracts_26 using gin(payload);
alter table public.dashboard_rpc_contracts_26 enable row level security;
drop policy if exists dashboard_rpc_contracts_26_service_role_all on public.dashboard_rpc_contracts_26;
create policy dashboard_rpc_contracts_26_service_role_all on public.dashboard_rpc_contracts_26 for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');

create table if not exists public.dashboard_rpc_contracts_27 (
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
create index if not exists idx_dashboard_rpc_contracts_27_tenant_status on public.dashboard_rpc_contracts_27(tenant_id, status);
create index if not exists idx_dashboard_rpc_contracts_27_payload_gin on public.dashboard_rpc_contracts_27 using gin(payload);
alter table public.dashboard_rpc_contracts_27 enable row level security;
drop policy if exists dashboard_rpc_contracts_27_service_role_all on public.dashboard_rpc_contracts_27;
create policy dashboard_rpc_contracts_27_service_role_all on public.dashboard_rpc_contracts_27 for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');

create table if not exists public.dashboard_rpc_contracts_28 (
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
create index if not exists idx_dashboard_rpc_contracts_28_tenant_status on public.dashboard_rpc_contracts_28(tenant_id, status);
create index if not exists idx_dashboard_rpc_contracts_28_payload_gin on public.dashboard_rpc_contracts_28 using gin(payload);
alter table public.dashboard_rpc_contracts_28 enable row level security;
drop policy if exists dashboard_rpc_contracts_28_service_role_all on public.dashboard_rpc_contracts_28;
create policy dashboard_rpc_contracts_28_service_role_all on public.dashboard_rpc_contracts_28 for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');

create table if not exists public.dashboard_rpc_contracts_29 (
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
create index if not exists idx_dashboard_rpc_contracts_29_tenant_status on public.dashboard_rpc_contracts_29(tenant_id, status);
create index if not exists idx_dashboard_rpc_contracts_29_payload_gin on public.dashboard_rpc_contracts_29 using gin(payload);
alter table public.dashboard_rpc_contracts_29 enable row level security;
drop policy if exists dashboard_rpc_contracts_29_service_role_all on public.dashboard_rpc_contracts_29;
create policy dashboard_rpc_contracts_29_service_role_all on public.dashboard_rpc_contracts_29 for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');

create table if not exists public.dashboard_rpc_contracts_30 (
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
create index if not exists idx_dashboard_rpc_contracts_30_tenant_status on public.dashboard_rpc_contracts_30(tenant_id, status);
create index if not exists idx_dashboard_rpc_contracts_30_payload_gin on public.dashboard_rpc_contracts_30 using gin(payload);
alter table public.dashboard_rpc_contracts_30 enable row level security;
drop policy if exists dashboard_rpc_contracts_30_service_role_all on public.dashboard_rpc_contracts_30;
create policy dashboard_rpc_contracts_30_service_role_all on public.dashboard_rpc_contracts_30 for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');

create table if not exists public.dashboard_rpc_contracts_31 (
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
create index if not exists idx_dashboard_rpc_contracts_31_tenant_status on public.dashboard_rpc_contracts_31(tenant_id, status);
create index if not exists idx_dashboard_rpc_contracts_31_payload_gin on public.dashboard_rpc_contracts_31 using gin(payload);
alter table public.dashboard_rpc_contracts_31 enable row level security;
drop policy if exists dashboard_rpc_contracts_31_service_role_all on public.dashboard_rpc_contracts_31;
create policy dashboard_rpc_contracts_31_service_role_all on public.dashboard_rpc_contracts_31 for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');

create table if not exists public.dashboard_rpc_contracts_32 (
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
create index if not exists idx_dashboard_rpc_contracts_32_tenant_status on public.dashboard_rpc_contracts_32(tenant_id, status);
create index if not exists idx_dashboard_rpc_contracts_32_payload_gin on public.dashboard_rpc_contracts_32 using gin(payload);
alter table public.dashboard_rpc_contracts_32 enable row level security;
drop policy if exists dashboard_rpc_contracts_32_service_role_all on public.dashboard_rpc_contracts_32;
create policy dashboard_rpc_contracts_32_service_role_all on public.dashboard_rpc_contracts_32 for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');

create table if not exists public.dashboard_rpc_contracts_33 (
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
create index if not exists idx_dashboard_rpc_contracts_33_tenant_status on public.dashboard_rpc_contracts_33(tenant_id, status);
create index if not exists idx_dashboard_rpc_contracts_33_payload_gin on public.dashboard_rpc_contracts_33 using gin(payload);
alter table public.dashboard_rpc_contracts_33 enable row level security;
drop policy if exists dashboard_rpc_contracts_33_service_role_all on public.dashboard_rpc_contracts_33;
create policy dashboard_rpc_contracts_33_service_role_all on public.dashboard_rpc_contracts_33 for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');

create table if not exists public.dashboard_rpc_contracts_34 (
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
create index if not exists idx_dashboard_rpc_contracts_34_tenant_status on public.dashboard_rpc_contracts_34(tenant_id, status);
create index if not exists idx_dashboard_rpc_contracts_34_payload_gin on public.dashboard_rpc_contracts_34 using gin(payload);
alter table public.dashboard_rpc_contracts_34 enable row level security;
drop policy if exists dashboard_rpc_contracts_34_service_role_all on public.dashboard_rpc_contracts_34;
create policy dashboard_rpc_contracts_34_service_role_all on public.dashboard_rpc_contracts_34 for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');

create table if not exists public.dashboard_rpc_contracts_35 (
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
create index if not exists idx_dashboard_rpc_contracts_35_tenant_status on public.dashboard_rpc_contracts_35(tenant_id, status);
create index if not exists idx_dashboard_rpc_contracts_35_payload_gin on public.dashboard_rpc_contracts_35 using gin(payload);
alter table public.dashboard_rpc_contracts_35 enable row level security;
drop policy if exists dashboard_rpc_contracts_35_service_role_all on public.dashboard_rpc_contracts_35;
create policy dashboard_rpc_contracts_35_service_role_all on public.dashboard_rpc_contracts_35 for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');
