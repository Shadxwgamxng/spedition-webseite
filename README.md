# Baltic Freight GmbH – Speditions-Website

Unternehmenswebsite für die Baltic Freight GmbH (Falkenwalde) mit öffentlichem Bereich und einem
rollenbasierten Mitarbeiterbereich, der ausschließlich über **Discord-Login (OAuth2)** entsperrt wird. Gebaut
mit Next.js (App Router), TypeScript und Tailwind CSS.

## Erste Schritte

```bash
npm install
npm run dev
```

Öffne [http://localhost:3000](http://localhost:3000).

Weitere Befehle: `npm run build` (Produktions-Build), `npm start` (Produktions-Server), `npm run lint` (ESLint).

Anleitung zum Hosten auf Strato: siehe [`STRATO-HOSTING.md`](./STRATO-HOSTING.md).
Anleitung zum Hosten auf Living-Bots.net: siehe [`LIVING-BOTS-HOSTING.md`](./LIVING-BOTS-HOSTING.md).

## Öffentlicher Bereich

Startseite, Unsere Leistungen, Über uns, Geschäftsführung, News, Fuhrpark, Standort, Stellenangebote,
Bewerbungsportal, Auftrag einreichen, Rezensionen, Partner sowie Impressum/Datenschutz.

Alle diese Inhalte kommen live aus dem Server-Store (`src/lib/server/store.ts`, Daten in `.data/db.json`,
git-ignoriert) und lassen sich über die „Website-Verwaltung" (siehe unten) bearbeiten. Aktuell leere Bereiche
(News, Rezensionen, Fuhrpark-Kategorien) zeigen automatisch einen Platzhaltertext, bis dort echte Inhalte
eingetragen werden.

## Mitarbeiterbereich (`/mitarbeiter`)

Bereich mit **rollenbasierter Sichtbarkeit** — jede Rolle sieht in Sidebar und Dashboard nur ihre eigenen
Module; ein direkter Aufruf einer nicht erlaubten URL wird zur Übersicht zurückgeleitet (`src/lib/roles.ts`,
durchgesetzt in `DashboardShell`).

### Login: ausschließlich über Discord (OAuth2)

Es gibt **kein** Passwort-Login mehr. Ein Mitarbeitender loggt sich über „Mit Discord anmelden" ein
(`/mitarbeiter/login` → `GET /api/auth/discord/login` → Discord-Autorisierung → `GET
/api/auth/discord/callback`). Der Callback gleicht die vom Discord-Profil gelieferte, feste Nutzer-ID
(„Snowflake", **nicht** der änderbare Benutzername) gegen das Feld `discordId` der `employees`-Collection ab
(`verifyDiscordLogin` in `src/lib/server/store.ts`). Gibt es keinen Treffer, landet man mit einer Fehlermeldung
zurück auf der Login-Seite — das Konto muss zuerst von der Geschäftsführung verknüpft werden.

Bei Erfolg wird ein **signiertes, httpOnly Session-Cookie** gesetzt (HMAC-SHA256 über `node:crypto`,
`src/lib/server/session.ts`) — es lässt sich nicht durch Bearbeiten von `localStorage` oder Query-Parametern
fälschen. `GET /api/auth/session` liefert den aktuell eingeloggten Nutzer, `POST /api/auth/logout` löscht das
Cookie. Der OAuth-Callback ist zusätzlich per signiertem `state`-Cookie gegen CSRF abgesichert.

**Erforderliche Umgebungsvariablen** (z. B. in `.env.local`, siehe Hosting-Anleitungen):

| Variable | Zweck |
| --- | --- |
| `DISCORD_CLIENT_ID` | Client-ID der Discord-Anwendung |
| `DISCORD_CLIENT_SECRET` | Client-Secret der Discord-Anwendung |
| `DISCORD_REDIRECT_URI` | Muss exakt der in Discord hinterlegten Redirect-URI entsprechen, z. B. `https://deine-domain.de/api/auth/discord/callback` |
| `SESSION_SECRET` | Beliebige lange Zufallszeichenkette zum Signieren der Session-/State-Cookies |
| `OWNER_DISCORD_ID` | Deine eigene Discord-Nutzer-ID — wird beim allerersten Start automatisch als `discordId` des `admin`-Kontos gesetzt (löst das „Henne-Ei-Problem": ohne bestehendes Geschäftsführungs-Konto könnte sonst niemand ein erstes Konto verknüpfen) |

**Discord-Anwendung einrichten:**

1. [Discord Developer Portal](https://discord.com/developers/applications) → „New Application".
2. Reiter „OAuth2" → Client-ID und Client-Secret kopieren (→ `DISCORD_CLIENT_ID` / `DISCORD_CLIENT_SECRET`).
3. Dort unter „Redirects" die URL `https://deine-domain.de/api/auth/discord/callback` (bzw. für lokale
   Entwicklung `http://localhost:3000/api/auth/discord/callback`) eintragen und exakt so auch als
   `DISCORD_REDIRECT_URI` setzen.
4. Eigene Discord-Nutzer-ID ermitteln: Discord-Einstellungen → „Erweitert" → „Entwicklermodus" aktivieren, dann
   Rechtsklick auf den eigenen Namen → „Nutzer-ID kopieren" → als `OWNER_DISCORD_ID` setzen.

Ohne diese Variablen zeigt `/api/auth/discord/login` einen sprechenden Konfigurationsfehler statt eines
Redirects — der Mitarbeiterbereich bleibt dann für alle, inklusive der Geschäftsführung, unzugänglich.

### Mitarbeiter-Konten anlegen (nur Geschäftsführung)

Unter Website-Verwaltung → **„Mitarbeiter-Konten"** kann die Geschäftsführung neue Konten für Mitarbeitende
anlegen, bearbeiten und löschen — Benutzername (intern), Discord-Nutzer-ID, Discord-Benutzername (nur zur
Anzeige), Name, Abteilung sowie eine **feste Rolle** (Disposition, Lager, Fuhrpark & Werkstatt, Buchhaltung,
Fahrer oder Geschäftsführung), die automatisch dieselben Modul-Berechtigungen wie oben vergibt
(`src/lib/roles.ts`). Ein neues Fahrer-Konto bekommt beim Anlegen automatisch eine leere Fahrerkarte, damit die
digitale Fahrerkarte sofort funktioniert. Ohne eingetragene Discord-Nutzer-ID kann sich das Konto nicht
einloggen — das wird in der Liste farblich hervorgehoben.

Konten liegen serverseitig im Store (`employees`-Collection in `.data/db.json`), die Verwaltung läuft über
`src/app/api/employees/*`.

### Personalakten (nur Geschäftsführung)

Unter Website-Verwaltung → **„Personalakten"** legt jedes Mitarbeiter-Konto automatisch eine eigene Akte an
(1:1, `personnelFiles`-Collection) — sowohl neu angelegte Konten als auch die Seed-Konten beim ersten Start.
Eine Akte enthält persönliche Daten (Geburtsdatum/-ort, Staatsangehörigkeit, Adresse, private
Telefonnummer/E-Mail), Beschäftigungsdaten (Eintrittsdatum, Beschäftigungsart), Steuer-ID,
Sozialversicherungsnummer, Krankenkasse, IBAN sowie einen Notfallkontakt und ein freies Notizfeld — alles
direkt in der Akte editierbar. Zusätzlich lassen sich beliebige Dateien hochladen (z. B. Arbeitsvertrag,
Ausweiskopie) und einzeln wieder löschen.

Die Datei-Metadaten (Name, Typ, Größe, Zeitpunkt) liegen in `.data/db.json`, die hochgeladenen Bytes selbst
liegen separat unter `.data/uploads/` (ebenfalls git-ignoriert), referenziert über eine zufällige Datei-ID —
nie über den vom Nutzer angegebenen Dateinamen, damit ein präparierter Dateiname keinen Zugriff auf andere
Pfade auf dem Server bekommt. Uploads sind auf 20 MB pro Datei begrenzt. Wird ein Mitarbeiter-Konto gelöscht,
werden seine Personalakte und alle zugehörigen Dateien mit gelöscht (`src/app/api/personnel-files/*`,
`src/lib/server/store.ts`).

**Wichtig**: Personalakten enthalten besonders sensible Daten (Geburtsdatum, IBAN, Steuer-ID,
Sozialversicherungsnummer). Es gilt dieselbe Einschränkung wie für den Rest der Seite — siehe „Wichtige
Hinweise vor dem produktiven Einsatz" unten: Es gibt **keine** serverseitige Zugriffsprüfung auf die
`/api/personnel-files/*`-Routen, nur der clientseitig verlinkte Reiter ist an die Rolle Geschäftsführung
gebunden.

### Fahrer-Login → Fahrzeug → Disposition (echt, geräteübergreifend)

Ein `fahrerX`-Konto muss sich nach dem Login zunächst auf ein freies, einsatzbereites Fahrzeug anmelden
(„Fahrzeug-Gate", blockiert bis dahin den gesamten restlichen Mitarbeiterbereich). Diese Anmeldung läuft über die
Server-API (`src/app/api/vehicles/*`) mit einem dateibasierten Store (`.data/db.json`, git-ignoriert) — dadurch
sehen Disponenten auf einem **anderen Gerät/Tab** die Anmeldung live (Polling alle 4 s) im Bereich „Aktive
Fahrzeuge" und können neue Aufträge anlegen sowie live angemeldeten Fahrzeugen/Fahrern zuweisen.

### Digitale Fahrerkarte

Fahrer aktivieren ihre eigene Fahrerkarte und erfassen Pausen (Start/Ende) selbst; Lenkzeiten heute/Woche werden
gegen die gesetzlichen Grenzwerte (9 h/Tag, 56 h/Woche) angezeigt. Disposition und Geschäftsführung sehen **alle**
Fahrerkarten auf einen Blick, farblich markiert bei Überschreitung, und können pro Fahrer eine Erinnerung senden —
die dem Fahrer als Banner auf seiner Fahrerkarte erscheint, bis er sie bestätigt (`src/app/api/driver-cards/route.ts`).

### Auftragsanfragen von der Website

Über „Auftrag einreichen" eingehende Anfragen landen mit Status „Angefragt" direkt bei der Disposition
(Panel „Neue Anfragen von der Website"), die sie annehmen (inkl. Bestätigung des Liefertermins) oder ablehnen
kann. Jeder Auftrag in der Disposition lässt sich zudem über einen „Löschen"-Button je Zeile endgültig entfernen
(`DELETE /api/orders/[id]`).

### Aktuelle Aufträge & Chat mit der Disposition

Fahrer sehen unter „Aktuelle Aufträge" nur die ihnen zugewiesenen Aufträge mit allen Infos (Route, Termin,
Hinweise) und einen Chat-Thread je Auftrag. Die Disposition kann denselben Thread pro Zeile in der
Auftragstabelle aufklappen und antworten (`src/components/employee/order-chat.tsx`).

### Website-Verwaltung (nur Geschäftsführung)

Eigener Reiter zur Pflege **aller** öffentlichen Inhalte — News, Stellenangebote, Leistungen, Geschäftsführung,
Wichtige Positionen, Fuhrpark-Kategorien, Rezensionen, Partner sowie Unternehmensdaten (Adresse, Telefon,
E-Mail …). Änderungen erscheinen sofort auf der öffentlichen Website, ganz ohne Neustart/Deploy
(`src/app/mitarbeiter/(dashboard)/verwaltung/`, generische CRUD-API unter `src/app/api/admin/[collection]/*`).

**Hinweis zum Impressum**: Die Angaben unter „Rechtliches" (Impressum, Datenschutz) sind bewusst **nicht** über
die Website-Verwaltung editierbar, sondern fest in `src/lib/data.ts` (`legalContact`) hinterlegt. Sie zeigen die
real verantwortliche Person, unabhängig vom fiktiven Firmennamen „Baltic Freight GmbH", der über die
Website-Verwaltung gepflegt wird (§5 TMG verlangt eine echte, identifizierbare verantwortliche Person/Adresse).

### Lagerverwaltung & Inventuren

Artikel (SKU, Name, Lagerort, Bestand, Mindestbestand) werden serverseitig gespeichert (`stockItems`-Collection)
und starten leer, bis welche angelegt werden. Eine Inventur zählt die Bestände neu und setzt den Zeitstempel
„Letzte Inventur" — beides bleibt über Neustarts hinweg erhalten (`src/app/api/stock/*`).

### Digitales Fahrtenbuch

Fahrten (Datum, Fahrer, Fahrzeug, Strecke, km-Stände, Zweck) werden serverseitig gespeichert und starten leer.
Fahrer- und Fahrzeugauswahl im Erfassungsformular kommen live aus den echten Mitarbeiter-Konten (Rolle „Fahrer")
und dem echten Fuhrpark, nicht aus einer festen Liste (`src/app/api/trips/*`).

### Rechnungserstellung mit PDF-Export

Rechnungen werden serverseitig gespeichert (`invoices`-Collection, starten leer) und lassen sich mit Positionen
kalkulieren, deren Zahlungsstatus (Offen/Bezahlt/Überfällig) direkt in der Liste ändern und zusätzlich direkt als
PDF herunterladen (`src/lib/invoice-pdf.ts`, via `jspdf`) — sowohl beim Erstellen als auch nachträglich aus der
Liste (`src/app/api/invoices/*`).

### Finanzbuchhaltung

Zeigt eine ehrliche, auf die echten Rechnungsdaten beschränkte Übersicht (offene Forderungen, bezahlt gesamt,
überfällige Rechnungen) — es gibt bewusst **keine** erfundene Ausgaben-/Kassenbuchhaltung (Kraftstoff, Personal,
Werkstatt) mehr, da dafür keine echte Datenquelle existiert; die Seite weist das auch so aus.

### Fahrzeugverwaltung: Anlegen/Löschen

Nur die Geschäftsführung sieht in der Fahrzeugverwaltung zusätzlich ein Formular zum Anlegen neuer Fahrzeuge und
einen Löschen-Button je Zeile; alle anderen Rollen mit Zugriff auf dieses Modul sehen es weiterhin nur lesend.

## Wichtige Hinweise vor dem produktiven Einsatz

Dies ist eine funktionale Demo mit einem schlanken eigenen Backend. Vor einem echten Launch sollte ergänzt werden:

- **Authentifizierung**: Der Login selbst ist jetzt kryptographisch sauber — Discord-OAuth2 mit signiertem,
  httpOnly Session-Cookie (siehe oben), kein Passwort mehr im Store, keine fälschbare `localStorage`-Session. Was
  weiterhin **fehlt**, ist serverseitige **Autorisierung**: Die Rollenprüfung (`src/lib/roles.ts`) läuft nur
  clientseitig in der UI — die API-Routen unter `/api/*` prüfen aktuell **nicht**, ob der aufrufende Nutzer
  überhaupt eingeloggt ist oder die passende Rolle hat, und sind technisch offen erreichbar (insbesondere
  `/api/employees`, `/api/admin/*`, `/api/stock`, `/api/trips`, `/api/invoices`, `/api/vehicles` POST/DELETE,
  `/api/driver-cards`, `/api/orders`, `/api/personnel-files/*`). Das betrifft **besonders** die Personalakten,
  die sensible personenbezogene Daten enthalten (siehe oben). Für den Produktivbetrieb braucht es serverseitig
  durchgesetzte Rollen/Rechte auf jeder API-Route (z. B. Session-Cookie in jeder Route Handler prüfen, bevor
  Daten gelesen/geändert werden) — bei den Personalakten idealerweise als Erstes.
- **Datenpersistenz**: Disposition, Fahrzeuge, Fahrerkarten, Aufträge/Chat, Lagerbestände, Fahrtenbuch, Rechnungen,
  Personalakten und alle Website-Inhalte laufen über einen dateibasierten Store (eine JSON-Datei auf dem Server,
  `src/lib/server/store.ts`) — funktional korrekt für eine Einzelserver-Demo, aber nicht nebenläufigkeitssicher und
  kein Ersatz für eine echte Datenbank. Regelmäßige Backups von `.data/db.json` **und** `.data/uploads/`
  (Personalakten-Dokumente) sind empfehlenswert (siehe Hosting-Anleitungen).
- **Formulare**: Das Kontaktformular und das Bewerbungsportal zeigen aktuell nur eine Erfolgsmeldung an; es wird
  noch keine E-Mail versendet oder Datei gespeichert. Hierfür wird ein Backend (API-Route + E-Mail-Versand bzw.
  Dateispeicher) benötigt.
- **Rechtliche Angaben**: Handelsregisternummer/USt-ID sind bewusst nicht angegeben (siehe Hinweis auf der
  Impressum-Seite). Sollte sich das ändern, `src/lib/data.ts` (`legalContact`) sowie die Impressum-Seite
  entsprechend ergänzen und rechtlich prüfen lassen.
- **Lenkzeiten**: Neu angelegte Fahrerkarten starten bei 0 Minuten (heute/Woche/Pause) und füllen sich nur durch
  echte Nutzung (Aktivieren/Pausieren durch den Fahrer). Es gibt weiterhin **keine** automatische
  Tages-/Wochen-Rollover-Logik oder Anbindung an echte Fahrtenschreiber-/Telematikdaten — die Werte laufen so
  lange weiter, bis sie manuell/serverseitig zurückgesetzt werden.
