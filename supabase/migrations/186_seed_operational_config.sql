-- 186_seed_operational_config.sql
-- Learnzur production migration layer with concrete tables, views, policies and operational contracts.

create table if not exists public.seed_operational_config_01 (
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
create index if not exists idx_seed_operational_config_01_tenant_status on public.seed_operational_config_01(tenant_id, status);
create index if not exists idx_seed_operational_config_01_payload_gin on public.seed_operational_config_01 using gin(payload);
alter table public.seed_operational_config_01 enable row level security;
drop policy if exists seed_operational_config_01_service_role_all on public.seed_operational_config_01;
create policy seed_operational_config_01_service_role_all on public.seed_operational_config_01 for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');

create table if not exists public.seed_operational_config_02 (
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
create index if not exists idx_seed_operational_config_02_tenant_status on public.seed_operational_config_02(tenant_id, status);
create index if not exists idx_seed_operational_config_02_payload_gin on public.seed_operational_config_02 using gin(payload);
alter table public.seed_operational_config_02 enable row level security;
drop policy if exists seed_operational_config_02_service_role_all on public.seed_operational_config_02;
create policy seed_operational_config_02_service_role_all on public.seed_operational_config_02 for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');

create table if not exists public.seed_operational_config_03 (
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
create index if not exists idx_seed_operational_config_03_tenant_status on public.seed_operational_config_03(tenant_id, status);
create index if not exists idx_seed_operational_config_03_payload_gin on public.seed_operational_config_03 using gin(payload);
alter table public.seed_operational_config_03 enable row level security;
drop policy if exists seed_operational_config_03_service_role_all on public.seed_operational_config_03;
create policy seed_operational_config_03_service_role_all on public.seed_operational_config_03 for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');

create table if not exists public.seed_operational_config_04 (
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
create index if not exists idx_seed_operational_config_04_tenant_status on public.seed_operational_config_04(tenant_id, status);
create index if not exists idx_seed_operational_config_04_payload_gin on public.seed_operational_config_04 using gin(payload);
alter table public.seed_operational_config_04 enable row level security;
drop policy if exists seed_operational_config_04_service_role_all on public.seed_operational_config_04;
create policy seed_operational_config_04_service_role_all on public.seed_operational_config_04 for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');

create table if not exists public.seed_operational_config_05 (
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
create index if not exists idx_seed_operational_config_05_tenant_status on public.seed_operational_config_05(tenant_id, status);
create index if not exists idx_seed_operational_config_05_payload_gin on public.seed_operational_config_05 using gin(payload);
alter table public.seed_operational_config_05 enable row level security;
drop policy if exists seed_operational_config_05_service_role_all on public.seed_operational_config_05;
create policy seed_operational_config_05_service_role_all on public.seed_operational_config_05 for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');

create table if not exists public.seed_operational_config_06 (
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
create index if not exists idx_seed_operational_config_06_tenant_status on public.seed_operational_config_06(tenant_id, status);
create index if not exists idx_seed_operational_config_06_payload_gin on public.seed_operational_config_06 using gin(payload);
alter table public.seed_operational_config_06 enable row level security;
drop policy if exists seed_operational_config_06_service_role_all on public.seed_operational_config_06;
create policy seed_operational_config_06_service_role_all on public.seed_operational_config_06 for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');

create table if not exists public.seed_operational_config_07 (
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
create index if not exists idx_seed_operational_config_07_tenant_status on public.seed_operational_config_07(tenant_id, status);
create index if not exists idx_seed_operational_config_07_payload_gin on public.seed_operational_config_07 using gin(payload);
alter table public.seed_operational_config_07 enable row level security;
drop policy if exists seed_operational_config_07_service_role_all on public.seed_operational_config_07;
create policy seed_operational_config_07_service_role_all on public.seed_operational_config_07 for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');

create table if not exists public.seed_operational_config_08 (
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
create index if not exists idx_seed_operational_config_08_tenant_status on public.seed_operational_config_08(tenant_id, status);
create index if not exists idx_seed_operational_config_08_payload_gin on public.seed_operational_config_08 using gin(payload);
alter table public.seed_operational_config_08 enable row level security;
drop policy if exists seed_operational_config_08_service_role_all on public.seed_operational_config_08;
create policy seed_operational_config_08_service_role_all on public.seed_operational_config_08 for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');

create table if not exists public.seed_operational_config_09 (
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
create index if not exists idx_seed_operational_config_09_tenant_status on public.seed_operational_config_09(tenant_id, status);
create index if not exists idx_seed_operational_config_09_payload_gin on public.seed_operational_config_09 using gin(payload);
alter table public.seed_operational_config_09 enable row level security;
drop policy if exists seed_operational_config_09_service_role_all on public.seed_operational_config_09;
create policy seed_operational_config_09_service_role_all on public.seed_operational_config_09 for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');

create table if not exists public.seed_operational_config_10 (
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
create index if not exists idx_seed_operational_config_10_tenant_status on public.seed_operational_config_10(tenant_id, status);
create index if not exists idx_seed_operational_config_10_payload_gin on public.seed_operational_config_10 using gin(payload);
alter table public.seed_operational_config_10 enable row level security;
drop policy if exists seed_operational_config_10_service_role_all on public.seed_operational_config_10;
create policy seed_operational_config_10_service_role_all on public.seed_operational_config_10 for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');

create table if not exists public.seed_operational_config_11 (
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
create index if not exists idx_seed_operational_config_11_tenant_status on public.seed_operational_config_11(tenant_id, status);
create index if not exists idx_seed_operational_config_11_payload_gin on public.seed_operational_config_11 using gin(payload);
alter table public.seed_operational_config_11 enable row level security;
drop policy if exists seed_operational_config_11_service_role_all on public.seed_operational_config_11;
create policy seed_operational_config_11_service_role_all on public.seed_operational_config_11 for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');

create table if not exists public.seed_operational_config_12 (
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
create index if not exists idx_seed_operational_config_12_tenant_status on public.seed_operational_config_12(tenant_id, status);
create index if not exists idx_seed_operational_config_12_payload_gin on public.seed_operational_config_12 using gin(payload);
alter table public.seed_operational_config_12 enable row level security;
drop policy if exists seed_operational_config_12_service_role_all on public.seed_operational_config_12;
create policy seed_operational_config_12_service_role_all on public.seed_operational_config_12 for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');

create table if not exists public.seed_operational_config_13 (
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
create index if not exists idx_seed_operational_config_13_tenant_status on public.seed_operational_config_13(tenant_id, status);
create index if not exists idx_seed_operational_config_13_payload_gin on public.seed_operational_config_13 using gin(payload);
alter table public.seed_operational_config_13 enable row level security;
drop policy if exists seed_operational_config_13_service_role_all on public.seed_operational_config_13;
create policy seed_operational_config_13_service_role_all on public.seed_operational_config_13 for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');

create table if not exists public.seed_operational_config_14 (
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
create index if not exists idx_seed_operational_config_14_tenant_status on public.seed_operational_config_14(tenant_id, status);
create index if not exists idx_seed_operational_config_14_payload_gin on public.seed_operational_config_14 using gin(payload);
alter table public.seed_operational_config_14 enable row level security;
drop policy if exists seed_operational_config_14_service_role_all on public.seed_operational_config_14;
create policy seed_operational_config_14_service_role_all on public.seed_operational_config_14 for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');

create table if not exists public.seed_operational_config_15 (
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
create index if not exists idx_seed_operational_config_15_tenant_status on public.seed_operational_config_15(tenant_id, status);
create index if not exists idx_seed_operational_config_15_payload_gin on public.seed_operational_config_15 using gin(payload);
alter table public.seed_operational_config_15 enable row level security;
drop policy if exists seed_operational_config_15_service_role_all on public.seed_operational_config_15;
create policy seed_operational_config_15_service_role_all on public.seed_operational_config_15 for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');

create table if not exists public.seed_operational_config_16 (
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
create index if not exists idx_seed_operational_config_16_tenant_status on public.seed_operational_config_16(tenant_id, status);
create index if not exists idx_seed_operational_config_16_payload_gin on public.seed_operational_config_16 using gin(payload);
alter table public.seed_operational_config_16 enable row level security;
drop policy if exists seed_operational_config_16_service_role_all on public.seed_operational_config_16;
create policy seed_operational_config_16_service_role_all on public.seed_operational_config_16 for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');

create table if not exists public.seed_operational_config_17 (
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
create index if not exists idx_seed_operational_config_17_tenant_status on public.seed_operational_config_17(tenant_id, status);
create index if not exists idx_seed_operational_config_17_payload_gin on public.seed_operational_config_17 using gin(payload);
alter table public.seed_operational_config_17 enable row level security;
drop policy if exists seed_operational_config_17_service_role_all on public.seed_operational_config_17;
create policy seed_operational_config_17_service_role_all on public.seed_operational_config_17 for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');

create table if not exists public.seed_operational_config_18 (
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
create index if not exists idx_seed_operational_config_18_tenant_status on public.seed_operational_config_18(tenant_id, status);
create index if not exists idx_seed_operational_config_18_payload_gin on public.seed_operational_config_18 using gin(payload);
alter table public.seed_operational_config_18 enable row level security;
drop policy if exists seed_operational_config_18_service_role_all on public.seed_operational_config_18;
create policy seed_operational_config_18_service_role_all on public.seed_operational_config_18 for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');

create table if not exists public.seed_operational_config_19 (
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
create index if not exists idx_seed_operational_config_19_tenant_status on public.seed_operational_config_19(tenant_id, status);
create index if not exists idx_seed_operational_config_19_payload_gin on public.seed_operational_config_19 using gin(payload);
alter table public.seed_operational_config_19 enable row level security;
drop policy if exists seed_operational_config_19_service_role_all on public.seed_operational_config_19;
create policy seed_operational_config_19_service_role_all on public.seed_operational_config_19 for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');

create table if not exists public.seed_operational_config_20 (
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
create index if not exists idx_seed_operational_config_20_tenant_status on public.seed_operational_config_20(tenant_id, status);
create index if not exists idx_seed_operational_config_20_payload_gin on public.seed_operational_config_20 using gin(payload);
alter table public.seed_operational_config_20 enable row level security;
drop policy if exists seed_operational_config_20_service_role_all on public.seed_operational_config_20;
create policy seed_operational_config_20_service_role_all on public.seed_operational_config_20 for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');

create table if not exists public.seed_operational_config_21 (
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
create index if not exists idx_seed_operational_config_21_tenant_status on public.seed_operational_config_21(tenant_id, status);
create index if not exists idx_seed_operational_config_21_payload_gin on public.seed_operational_config_21 using gin(payload);
alter table public.seed_operational_config_21 enable row level security;
drop policy if exists seed_operational_config_21_service_role_all on public.seed_operational_config_21;
create policy seed_operational_config_21_service_role_all on public.seed_operational_config_21 for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');

create table if not exists public.seed_operational_config_22 (
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
create index if not exists idx_seed_operational_config_22_tenant_status on public.seed_operational_config_22(tenant_id, status);
create index if not exists idx_seed_operational_config_22_payload_gin on public.seed_operational_config_22 using gin(payload);
alter table public.seed_operational_config_22 enable row level security;
drop policy if exists seed_operational_config_22_service_role_all on public.seed_operational_config_22;
create policy seed_operational_config_22_service_role_all on public.seed_operational_config_22 for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');

create table if not exists public.seed_operational_config_23 (
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
create index if not exists idx_seed_operational_config_23_tenant_status on public.seed_operational_config_23(tenant_id, status);
create index if not exists idx_seed_operational_config_23_payload_gin on public.seed_operational_config_23 using gin(payload);
alter table public.seed_operational_config_23 enable row level security;
drop policy if exists seed_operational_config_23_service_role_all on public.seed_operational_config_23;
create policy seed_operational_config_23_service_role_all on public.seed_operational_config_23 for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');

create table if not exists public.seed_operational_config_24 (
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
create index if not exists idx_seed_operational_config_24_tenant_status on public.seed_operational_config_24(tenant_id, status);
create index if not exists idx_seed_operational_config_24_payload_gin on public.seed_operational_config_24 using gin(payload);
alter table public.seed_operational_config_24 enable row level security;
drop policy if exists seed_operational_config_24_service_role_all on public.seed_operational_config_24;
create policy seed_operational_config_24_service_role_all on public.seed_operational_config_24 for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');

create table if not exists public.seed_operational_config_25 (
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
create index if not exists idx_seed_operational_config_25_tenant_status on public.seed_operational_config_25(tenant_id, status);
create index if not exists idx_seed_operational_config_25_payload_gin on public.seed_operational_config_25 using gin(payload);
alter table public.seed_operational_config_25 enable row level security;
drop policy if exists seed_operational_config_25_service_role_all on public.seed_operational_config_25;
create policy seed_operational_config_25_service_role_all on public.seed_operational_config_25 for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');

create table if not exists public.seed_operational_config_26 (
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
create index if not exists idx_seed_operational_config_26_tenant_status on public.seed_operational_config_26(tenant_id, status);
create index if not exists idx_seed_operational_config_26_payload_gin on public.seed_operational_config_26 using gin(payload);
alter table public.seed_operational_config_26 enable row level security;
drop policy if exists seed_operational_config_26_service_role_all on public.seed_operational_config_26;
create policy seed_operational_config_26_service_role_all on public.seed_operational_config_26 for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');

create table if not exists public.seed_operational_config_27 (
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
create index if not exists idx_seed_operational_config_27_tenant_status on public.seed_operational_config_27(tenant_id, status);
create index if not exists idx_seed_operational_config_27_payload_gin on public.seed_operational_config_27 using gin(payload);
alter table public.seed_operational_config_27 enable row level security;
drop policy if exists seed_operational_config_27_service_role_all on public.seed_operational_config_27;
create policy seed_operational_config_27_service_role_all on public.seed_operational_config_27 for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');

create table if not exists public.seed_operational_config_28 (
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
create index if not exists idx_seed_operational_config_28_tenant_status on public.seed_operational_config_28(tenant_id, status);
create index if not exists idx_seed_operational_config_28_payload_gin on public.seed_operational_config_28 using gin(payload);
alter table public.seed_operational_config_28 enable row level security;
drop policy if exists seed_operational_config_28_service_role_all on public.seed_operational_config_28;
create policy seed_operational_config_28_service_role_all on public.seed_operational_config_28 for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');

create table if not exists public.seed_operational_config_29 (
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
create index if not exists idx_seed_operational_config_29_tenant_status on public.seed_operational_config_29(tenant_id, status);
create index if not exists idx_seed_operational_config_29_payload_gin on public.seed_operational_config_29 using gin(payload);
alter table public.seed_operational_config_29 enable row level security;
drop policy if exists seed_operational_config_29_service_role_all on public.seed_operational_config_29;
create policy seed_operational_config_29_service_role_all on public.seed_operational_config_29 for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');

create table if not exists public.seed_operational_config_30 (
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
create index if not exists idx_seed_operational_config_30_tenant_status on public.seed_operational_config_30(tenant_id, status);
create index if not exists idx_seed_operational_config_30_payload_gin on public.seed_operational_config_30 using gin(payload);
alter table public.seed_operational_config_30 enable row level security;
drop policy if exists seed_operational_config_30_service_role_all on public.seed_operational_config_30;
create policy seed_operational_config_30_service_role_all on public.seed_operational_config_30 for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');

create table if not exists public.seed_operational_config_31 (
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
create index if not exists idx_seed_operational_config_31_tenant_status on public.seed_operational_config_31(tenant_id, status);
create index if not exists idx_seed_operational_config_31_payload_gin on public.seed_operational_config_31 using gin(payload);
alter table public.seed_operational_config_31 enable row level security;
drop policy if exists seed_operational_config_31_service_role_all on public.seed_operational_config_31;
create policy seed_operational_config_31_service_role_all on public.seed_operational_config_31 for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');

create table if not exists public.seed_operational_config_32 (
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
create index if not exists idx_seed_operational_config_32_tenant_status on public.seed_operational_config_32(tenant_id, status);
create index if not exists idx_seed_operational_config_32_payload_gin on public.seed_operational_config_32 using gin(payload);
alter table public.seed_operational_config_32 enable row level security;
drop policy if exists seed_operational_config_32_service_role_all on public.seed_operational_config_32;
create policy seed_operational_config_32_service_role_all on public.seed_operational_config_32 for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');

create table if not exists public.seed_operational_config_33 (
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
create index if not exists idx_seed_operational_config_33_tenant_status on public.seed_operational_config_33(tenant_id, status);
create index if not exists idx_seed_operational_config_33_payload_gin on public.seed_operational_config_33 using gin(payload);
alter table public.seed_operational_config_33 enable row level security;
drop policy if exists seed_operational_config_33_service_role_all on public.seed_operational_config_33;
create policy seed_operational_config_33_service_role_all on public.seed_operational_config_33 for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');

create table if not exists public.seed_operational_config_34 (
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
create index if not exists idx_seed_operational_config_34_tenant_status on public.seed_operational_config_34(tenant_id, status);
create index if not exists idx_seed_operational_config_34_payload_gin on public.seed_operational_config_34 using gin(payload);
alter table public.seed_operational_config_34 enable row level security;
drop policy if exists seed_operational_config_34_service_role_all on public.seed_operational_config_34;
create policy seed_operational_config_34_service_role_all on public.seed_operational_config_34 for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');

create table if not exists public.seed_operational_config_35 (
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
create index if not exists idx_seed_operational_config_35_tenant_status on public.seed_operational_config_35(tenant_id, status);
create index if not exists idx_seed_operational_config_35_payload_gin on public.seed_operational_config_35 using gin(payload);
alter table public.seed_operational_config_35 enable row level security;
drop policy if exists seed_operational_config_35_service_role_all on public.seed_operational_config_35;
create policy seed_operational_config_35_service_role_all on public.seed_operational_config_35 for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');
