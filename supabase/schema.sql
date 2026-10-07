-- REGEN406 v30 – Supabase schema (contains no personal signup data)
create extension if not exists pgcrypto;

create table if not exists public.signups (
  id uuid primary key default gen_random_uuid(),
  event_type text not null,
  event_id text not null,
  slot text not null,
  role text,
  name text not null default '',
  comment text,
  child_ages text,
  cancellation_token uuid not null default gen_random_uuid(),
  created_at timestamptz not null default now()
);

alter table public.signups add column if not exists legacy_import boolean not null default false;
create index if not exists signups_event_idx on public.signups (event_type, event_id, slot);

-- Browser greifen nie direkt auf die Tabelle zu. Nur die Next.js-API nutzt
-- serverseitig den Supabase Secret Key (service_role).
alter table public.signups enable row level security;
revoke all on table public.signups from anon, authenticated;
grant all on table public.signups to service_role;


-- Abmeldeanfragen fuer Eintraege, die auf einem anderen Geraet erstellt wurden.
create table if not exists public.cancellation_requests (
  id uuid primary key default gen_random_uuid(),
  signup_id uuid not null unique references public.signups(id) on delete cascade,
  message text,
  created_at timestamptz not null default now()
);

create index if not exists cancellation_requests_created_idx on public.cancellation_requests (created_at desc);
alter table public.cancellation_requests enable row level security;
revoke all on table public.cancellation_requests from anon, authenticated;
grant all on table public.cancellation_requests to service_role;
