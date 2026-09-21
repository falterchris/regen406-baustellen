# REGEN406 Baustellen-Wochenenden

Landingpage mit öffentlicher Helfer:innenliste, verbindlicher Anmeldung und sicherer Abmelde-Anfrage für die REGEN406 Baustellen-Aktionen.

## Einmalig einrichten

1. Im bereitgestellten Google Sheet unter **Erweiterungen → Apps Script** den Inhalt aus `google-apps-script/Code.gs` einfügen und speichern.
2. Oben rechts **Bereitstellen → Neue Bereitstellung → Web-App** wählen. Ausführen als: **Ich**. Zugriff: **Jeder**. Die angezeigte URL kopieren.
3. In Vercel beim Projekt unter **Settings → Environment Variables** setzen:
   - `GOOGLE_APPS_SCRIPT_URL` = die URL der Web-App
4. Dieses Verzeichnis in ein neues GitHub-Repository pushen und das Repository in Vercel importieren. Framework: **Next.js**.

Das Google Sheet selbst muss nicht öffentlich freigegeben werden. Es bleibt eure interne Übersicht; die Website greift ausschließlich über die Web-App darauf zu.

Wenn die optionale Kommentarfunktion eingesetzt werden soll, den aktualisierten Inhalt aus `google-apps-script/Code.gs` speichern und die bestehende Web-App erneut bereitstellen. Das Tabellenblatt erhält automatisch die zusätzliche Spalte **Kommentar**.

## Abmelde-Anfragen

Die Website löscht keine Anmeldung direkt. Wer sich auf dem eigenen Gerät eingetragen hat, kann eine Abmeldung anfragen. Diese erscheint im Google Sheet im neuen Tabellenblatt **Abmeldungen**. Dort die Anfrage als erledigt markieren und die entsprechende Zeile im Tabellenblatt **Anmeldungen** löschen.

## Lokal starten

```bash
npm install
npm run dev
```
