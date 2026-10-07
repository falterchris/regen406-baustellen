-- REGEN406 v31 – Erweiterung fuer Abmeldeanfragen
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
