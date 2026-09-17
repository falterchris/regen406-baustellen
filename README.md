# REGEN406 Baustellen-Wochenenden

Kleine Landingpage mit öffentlicher Helfer:innenliste und verbindlicher Anmeldung für vier Baustellen-Wochenenden.

## Einmalig einrichten

1. Im bereitgestellten Google Sheet unter **Erweiterungen → Apps Script** den Inhalt aus `google-apps-script/Code.gs` einfügen und speichern.
2. Oben rechts **Bereitstellen → Neue Bereitstellung → Web-App** wählen. Ausführen als: **Ich**. Zugriff: **Jeder**. Die angezeigte URL kopieren.
3. In Vercel beim Projekt unter **Settings → Environment Variables** setzen:
   - `GOOGLE_APPS_SCRIPT_URL` = die URL der Web-App
4. Dieses Verzeichnis in ein neues GitHub-Repository pushen und das Repository in Vercel importieren. Framework: **Next.js**.

Das Google Sheet selbst muss nicht öffentlich freigegeben werden. Es bleibt eure interne Übersicht; die Website greift ausschließlich über die Web-App darauf zu.

## Lokal starten

```bash
npm install
npm run dev
```
