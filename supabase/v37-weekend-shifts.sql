-- REGEN406 v37 – bestehende Ganztags-Anmeldungen auf neue Wochenend-Schichten verteilen
-- Samstag/Sonntag: bisherige Ganztags-Helfer:innen werden in 10–14 Uhr UND 14–19 Uhr übernommen.
-- Freitag im November bleibt 14–19 Uhr und wird als Helfer:in markiert.

begin;

create temporary table tmp_weekend_legacy on commit drop as
select
  id as original_id,
  gen_random_uuid() as afternoon_id,
  event_id,
  slot as legacy_day,
  name,
  comment,
  created_at,
  legacy_import
from public.signups
where event_type = 'weekend'
  and slot in ('Samstag', 'Sonntag')
  and coalesce(role, '') = '';

-- Zweite Schicht anlegen (14–19 Uhr).
insert into public.signups (
  id, event_type, event_id, slot, role, name, comment, child_ages,
  cancellation_token, created_at, legacy_import
)
select
  afternoon_id,
  'weekend',
  event_id,
  case legacy_day
    when 'Samstag' then 'Samstag · 14–19 Uhr'
    else 'Sonntag · 14–19 Uhr'
  end,
  'Helfer:in',
  name,
  comment,
  null,
  gen_random_uuid(),
  created_at,
  legacy_import
from tmp_weekend_legacy;

-- Bestehenden Datensatz als Vormittagsschicht behalten.
update public.signups s
set
  slot = case t.legacy_day
    when 'Samstag' then 'Samstag · 10–14 Uhr'
    else 'Sonntag · 10–14 Uhr'
  end,
  role = 'Helfer:in'
from tmp_weekend_legacy t
where s.id = t.original_id;

-- Falls für einen alten Ganztags-Eintrag bereits eine Abmeldeanfrage offen war,
-- gilt sie auch für die neu angelegte Nachmittagsschicht.
insert into public.cancellation_requests (signup_id, message, created_at)
select t.afternoon_id, c.message, c.created_at
from tmp_weekend_legacy t
join public.cancellation_requests c on c.signup_id = t.original_id
on conflict (signup_id) do nothing;

-- Freitag im November war bereits eine einzelne 14–19-Uhr-Schicht.
update public.signups
set role = 'Helfer:in'
where event_type = 'weekend'
  and event_id = 'nov-2026'
  and slot = 'Freitag · 14–19 Uhr'
  and coalesce(role, '') = '';

-- Sicherheitsnetz: neue Wochenend-Schichten ohne Rolle als Helfer:in behandeln.
update public.signups
set role = 'Helfer:in'
where event_type = 'weekend'
  and slot in (
    'Samstag · 10–14 Uhr', 'Samstag · 14–19 Uhr',
    'Sonntag · 10–14 Uhr', 'Sonntag · 14–19 Uhr'
  )
  and coalesce(role, '') = '';

commit;

-- Kontrolle: sollte keine alten Samstag-/Sonntag-Ganztagszeilen mehr liefern.
select event_id, slot, role, count(*) as anzahl
from public.signups
where event_type = 'weekend'
group by event_id, slot, role
order by event_id, slot, role;
