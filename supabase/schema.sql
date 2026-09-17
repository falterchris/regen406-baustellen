create table if not exists public.signups (
  id uuid primary key default gen_random_uuid(),
  weekend_id text not null check (weekend_id in ('sep', 'oct', 'nov', 'dec')),
  day text not null check (day in ('Samstag', 'Sonntag', 'Beide Tage')),
  first_name text not null check (char_length(first_name) between 1 and 60),
  last_name text not null check (char_length(last_name) between 1 and 80),
  created_at timestamptz not null default now()
);

alter table public.signups enable row level security;
