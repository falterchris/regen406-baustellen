# REGEN406 Baustellen-Anmeldung
## v30 – Supabase statt Google Sheets

Die Baustellen-Anmeldung verwendet ab v30 **Supabase/Postgres** als Datenbank. Google Sheets und Google Apps Script sind vollständig aus dem Laufzeitpfad entfernt.

### Was bleibt gleich

- Baustellen-Woche 09.–18.10.2026
- Sonntag 18.10.: nur 10–15 Uhr; 15–19 Uhr entfällt
- Baustellencafé am 18.10. von 15–17 Uhr
- Rollen: Verpflegung, Lead, Helfer:in, Kinderbetreuung, Kinder
- Bei `Kinder` werden ausschließlich Altersangaben gespeichert
- Baustellen-Wochenenden November 2026 bis März 2027
- Eigene Einträge werden im Browser erkannt und können abgemeldet werden
- bestehendes Design, Mobile-Akkordeons, Vorschau-Datum und Archivierungslogik

## Technik

- Next.js / Vercel
- Supabase Postgres
- Serverzugriff über `SUPABASE_SECRET_KEY`; der Secret Key wird **nie** an den Browser ausgeliefert
- Die öffentliche Website spricht nur mit den eigenen Next.js-API-Routen
- Supabase RLS bleibt aktiviert; `anon` und `authenticated` haben keinen direkten Zugriff auf `signups`

Die Vercel-Supabase-Integration legt u. a. `SUPABASE_URL` und `SUPABASE_SECRET_KEY` automatisch an.

## Einmalig: Datenbank + bestehende Anmeldungen

Im Supabase Dashboard **SQL Editor → New query** zuerst den kompletten Inhalt von:

`supabase/schema.sql`

ausführen. Das Skript ergänzt die v30-Spalte `legacy_import`, aktiviert RLS und sperrt direkten öffentlichen Tabellenzugriff.

Danach die separat bereitgestellte Datei **`regen406-supabase-import-132-anmeldungen.sql`** im SQL Editor ausführen. Sie importiert die 132 vorhandenen Einträge und übernimmt die bestehenden UUIDs, damit bereits im Browser erkannte eigene Anmeldungen weiterhin erkannt werden. Der Import kann erneut ausgeführt werden, ohne Duplikate anzulegen.

**Wichtig:** Die Import-Datei enthält Namen und Kommentare und gehört deshalb **nicht ins GitHub-Repository**.

Hinweis: Im Import befinden sich noch drei historische Einträge für `sun-18-evening` (18.10., 15–19 Uhr). Die Schicht ist auf der öffentlichen Website weiterhin entfernt; die Einträge bleiben nur zur Nachvollziehbarkeit in Datenbank/Admin erhalten.

## Adminbereich

Admin-URL:

`/admin`

Dort können Anmeldungen:

- durchsucht werden
- nach Rolle und Schicht gefiltert werden
- gelöscht werden
- als CSV exportiert werden

### Admin-Passwort setzen

In Vercel unter **Project → Environment Variables** eine neue Variable anlegen:

`REGEN406_ADMIN_PASSWORD`

Das Passwort nur für **Production + Preview** setzen. **Kein `NEXT_PUBLIC_`-Prefix verwenden.**

Nach dem Anlegen der Variable das v30-Deployment neu deployen, damit die Variable verfügbar ist.

Die Admin-Sitzung wird als HttpOnly-Cookie gespeichert und läuft nach 12 Stunden ab.

## Abmelden

Neue Anmeldungen erhalten einen zufälligen Abmelde-Token. Dieser wird nur im Browser der anmeldenden Person gespeichert und nicht in der öffentlichen Liste ausgeliefert.

Die aus Google Sheets importierten Alt-Einträge behalten ihre bisherigen IDs. Für diese `legacy_import`-Einträge ist die alte ID-basierte Abmeldung weiterhin erlaubt, damit bereits vorhandene Browser-Anmeldungen nicht verloren gehen. Neue Einträge können nur noch mit ihrem privaten Token gelöscht werden.

## Vercel Environment Variables

Von der Supabase-Integration automatisch vorhanden:

- `SUPABASE_URL`
- `SUPABASE_SECRET_KEY`
- weitere Postgres-/Publishable-Variablen

Zusätzlich manuell setzen:

- `REGEN406_ADMIN_PASSWORD`

`GOOGLE_APPS_SCRIPT_URL` wird ab v30 nicht mehr verwendet und kann nach erfolgreichem Umstieg aus Vercel gelöscht werden.

## Empfohlener Rollout

1. `supabase/schema.sql` und danach die separate Import-SQL in Supabase ausführen.
2. `REGEN406_ADMIN_PASSWORD` in Vercel setzen.
3. v30 zunächst als **Preview Deployment** testen.
4. Prüfen: Laden, Eintragen, Kinder, Kinderbetreuung, Abmelden, `/admin`.
5. Erst danach das v30-Deployment zu Production promoten.
6. Wenn alles läuft, `GOOGLE_APPS_SCRIPT_URL` aus Vercel entfernen; das alte Google Sheet kann als Archiv bestehen bleiben.

## Lokal starten

Für lokales Testen müssen die Supabase-Variablen aus Vercel in `.env.local` verfügbar sein.

```bash
npm install
npm run dev
```

## v31 additions
- Admin can edit existing signups without changing signup ID/cancellation token/created_at.
- Public fallback "Abmeldung anfragen" for signups not recognized as owned on the current browser/device.
- Admin can approve (delete signup) or reject cancellation requests.
- Better cancellation button contrast: white in construction-week pink tags, black in weekend green tags.
- Run `supabase/v31-cancellation-requests.sql` once in Supabase SQL Editor before deploying v31.

## v32 – Abmelden UX
- Abmelde-Aktion steht direkt neben Eintragen und nutzt das gleiche Button-Design.
- Pro Bereich wird nur eine Abmelde-Aktion gezeigt: erkannter eigener Eintrag = `Abmelden`, sonst = `Abmeldung anfragen`.
- Inline-Abmelden-Links an den Namen wurden entfernt.
- Bei mehreren eigenen Einträgen im selben Bereich kann der gewünschte Eintrag vor der direkten Abmeldung ausgewählt werden.


## v33 – Namen & vergangene Bauwochen-Tage

- Neue persoenliche Anmeldungen fragen Vorname und Nachname getrennt als Pflichtfelder ab.
- In Supabase/Admin wird der volle Name gespeichert; auf der oeffentlichen Seite wird nur der Vorname ausgegeben.
- Kinder-Eintraege bleiben reine Altersangaben.
- Vergangene Tage der Baustellen-Woche bleiben waehrend der Bauwoche plus drei Tage als kompakte, ausgegraute Archivzeile sichtbar.
- Drei Tage nach Ende der Baustellen-Woche verschwindet der komplette Bauwochen-Bereich.
- Keine Supabase-Migration erforderlich; die bestehende Spalte `name` speichert weiterhin den vollstaendigen Namen.
