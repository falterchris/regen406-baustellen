# REGEN406 Baustellen-Anmeldung
## Update v26

- Sonntag, 18.10.2026: Die Vormittagsschicht 10–15 Uhr bleibt bestehen.
- Nur die letzte Schicht 15–19 Uhr entfällt und kann nicht mehr gebucht werden.
- Das Baustellencafé 15–17 Uhr bleibt bestehen.


Landingpage mit öffentlicher Helfer:innenliste, Anmeldung und direkter Abmeldung für die REGEN406 Baustellen-Aktionen.

## Technik

- Next.js / Vercel
- Google Sheets + Google Apps Script
- `GOOGLE_APPS_SCRIPT_URL` als Vercel Environment Variable

## Performance

Die öffentliche Helfer:innenliste wird serverseitig geladen und bereits mit der Seite ausgeliefert. Der Abruf von Google Apps Script / Google Sheets wird auf Vercel für 30 Sekunden gecacht. Dadurch müssen Besucher:innen beim normalen Seitenaufruf nicht mehr auf einen zusätzlichen Browser-Request zu Google warten.

Nach einer erfolgreichen Anmeldung oder Abmeldung wird der Cache sofort invalidiert.

### Schnelleres Eintragen (v24)

Beim Absenden erscheint die Person jetzt **sofort** als vorläufiger Eintrag in der gewählten Schicht bzw. am Wochenende. Die Speicherung in Google Sheets läuft parallel im Hintergrund. Nach erfolgreicher Speicherung wird derselbe Eintrag bestätigt und die permanente ID im Browser gespeichert. Falls Google Sheets nicht erreichbar ist, wird der vorläufige Eintrag automatisch wieder entfernt und es erscheint eine Schaltfläche zum erneuten Versuch.

Das Google Apps Script wurde ebenfalls entschlackt: Die Tabellenkopf-Prüfungen laufen nicht mehr bei jeder einzelnen Anmeldung. Außerdem übernimmt das Script die bereits im Browser erzeugte UUID, sodass der optimistische Eintrag und der endgültig gespeicherte Eintrag dieselbe ID haben.

**Für v24 muss `google-apps-script/Code.gs` im bestehenden Apps Script ersetzt und als neue Version bereitgestellt werden.** Die bestehende `/exec`-URL bleibt gleich.

## Favicon

Die Seite verwendet das REGEN406-Logo als Browser-Icon (`regen406-favicon-v2.png` und `favicon.ico`). Die Versionierung `?v=2` in `app/layout.tsx` hilft dabei, alte Browser-Caches des vorherigen Favicons zu umgehen.

## Einmalig einrichten

1. Im bereitgestellten Google Sheet unter **Erweiterungen → Apps Script** den Inhalt aus `google-apps-script/Code.gs` einfügen und speichern.
2. **Bereitstellen → Neue Bereitstellung → Web-App** wählen. Ausführen als: **Ich**. Zugriff: **Jeder**. Die angezeigte `/exec`-URL kopieren.
3. In Vercel unter **Settings → Environment Variables** setzen:
   - `GOOGLE_APPS_SCRIPT_URL` = URL der Web-App
4. Repository mit Vercel verbinden. Framework: **Next.js**.

Das Google Sheet muss nicht öffentlich freigegeben werden.

## Apps Script aktualisieren

Nur wenn sich `google-apps-script/Code.gs` tatsächlich geändert hat:

1. Google Sheet → **Erweiterungen → Apps Script**
2. Inhalt von `Code.gs` ersetzen und speichern
3. **Bereitstellen → Bereitstellungen verwalten**
4. Stift-Symbol → **Neue Version**
5. **Bereitstellen**

Die bestehende `/exec`-URL bleibt gleich.

## Baustellen-Woche 2026

Die Importfunktion `importConstructionWeek2026()` ist nur für die einmalige Übernahme des alten Schichtplans gedacht. Sie erkennt eine bereits erfolgte Übernahme und legt dann keine Duplikate an.

## Abmelden

Nach Bestätigung im Popup wird der zugehörige Eintrag direkt aus dem Tabellenblatt `Anmeldungen` gelöscht. Eigene Einträge werden über die im Browser gespeicherten Anmelde-IDs erkannt.

## Lokal starten

```bash
npm install
npm run dev
```


## v27 – Kinderbetreuung in der Baustellen-Woche

Bei Anmeldungen zur Baustellen-Woche kann nun angegeben werden, ob Kinderbetreuung benötigt wird. Wenn ja, wird ausschließlich das Alter der Kinder abgefragt (keine Namen). Die Angaben werden in den Spalten `Kinderbetreuung` und `Kinder (Alter)` im Blatt `Anmeldungen` gespeichert. Beim ersten neuen Bauwochen-Eintrag ergänzt das Apps Script diese Spalten automatisch, falls sie im bestehenden Sheet noch fehlen.
