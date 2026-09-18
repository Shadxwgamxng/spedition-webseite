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
Bewerbungsportal, Auftrag einreichen, Kunden-Login für Bestandskunden, Rezensionen, Partner sowie
Impressum/Datenschutz.

Alle diese Inhalte kommen live aus dem Server-Store (`src/lib/server/store.ts`, Daten in `.data/db.json`,
git-ignoriert) und lassen sich über die „Verwaltung" (siehe unten) bearbeiten. Aktuell leere Bereiche
(News, Rezensionen, Fuhrpark-Kategorien) zeigen automatisch einen Platzhaltertext, bis dort echte Inhalte
eingetragen werden.

## Mitarbeiterbereich (`/mitarbeiter`)

Bereich mit **rollenbasierter Sichtbarkeit** — jede Rolle sieht in Sidebar und Dashboard nur ihre eigenen
Module; ein direkter Aufruf einer nicht erlaubten URL wird zur Übersicht zurückgeleitet (`src/lib/roles.ts`,
durchgesetzt in `DashboardShell`).

| Rolle | Sichtbare Module |
| --- | --- |
| Geschäftsführer | **Alles**, inkl. Verwaltung, Personalakten, Bewerbungen und Anfragen; einzige Rolle mit Fahrzeuge anlegen/löschen |
| Prokurist | **Identisch zum Geschäftsführer** — beide Rollen teilen sich dieselbe Berechtigungsliste (`src/lib/roles.ts`) |
| Betriebsleiter | Disposition, Auftragspool, Lagerverwaltung, Fahrzeugverwaltung, Fahrtenbuch, Fahrerkarte (aller Fahrer), Kundenstammbaum, Anfragen, Stempeluhr (inkl. Team-Übersicht) |
| Chefdisponent | Disposition, Auftragspool, Fahrzeugverwaltung, Fahrerkarte (aller Fahrer, inkl. Erinnerungen senden), Kundenstammbaum, Anfragen, Stempeluhr |
| Disponent | Disposition, Auftragspool, Kundenstammbaum, Anfragen, Stempeluhr |
| Lager | Lagerverwaltung & Inventuren, Stempeluhr |
| Fuhrpark & Werkstatt | Fahrzeugverwaltung (nur lesend), Digitales Fahrtenbuch, Stempeluhr |
| Buchhaltung | Rechnungserstellung (inkl. PDF-Export), Finanzbuchhaltung, Stempeluhr |
| Fahrer | Nur eigene Fahrerkarte, „Aktuelle Aufträge" (Chat mit der Disposition) und Stempeluhr |

Stempeluhr ist bei **jeder** Rolle in der Sichtbarkeitsliste, weil sich jeder Mitarbeiter ein- und ausstempelt —
die Team-Übersicht über alle Mitarbeiter zeigt die Seite aber nur Geschäftsführung, Prokurist und Betriebsleitung
(siehe „Stempeluhr" unten). Kundenstammbaum und Anfragen sind wie Personalakten nach Aufgabenbereich beschränkt:
Geschäftsführung, Prokurist, Betriebsleitung und Disposition (Chefdisponent + Disponent) — alle anderen Rollen mit
Rechnungserstellung wählen einen Kunden trotzdem ganz normal in der Rechnung aus, ohne diesen eigenen Menüpunkt zu
sehen. Bewerbungen ist wie Personalakten auf Geschäftsführer und Prokurist beschränkt — dieselbe Begründung
(Personalentscheidungen, besonders sensible Daten) gilt hier genauso.

Personalakten sind bewusst auf Geschäftsführer und Prokurist beschränkt — von allen Rollen sind das die
einzigen, zu deren Aufgaben laut Rollenbeschreibung explizit Personalentscheidungen gehören, und die Daten
dahinter (Geburtsdatum, Adresse, IBAN, …) sind deutlich sensibler als alles andere in der App (siehe Abschnitt
„Personalakten" unten).

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
| `DISCORD_BOT_TOKEN` | Bot-Token derselben Discord-Anwendung — wird genutzt, um neu angelegten Mitarbeitenden automatisch eine Willkommens-DM mit Login-Link zu schicken (siehe unten). Optional: Ohne diese Variable werden Konten weiterhin ganz normal angelegt, nur die DM entfällt. |
| `TABLET_API_KEY` | Geteiltes Geheimnis mit dem FiveM Speditions-Tablet für die `/api/tablet/*`-Sync-Routen (siehe „Tablet-Sync" unten). Optional: Ohne diese Variable sind die Routen komplett gesperrt (fail closed), der Rest der Website läuft unverändert weiter. |

**Discord-Anwendung einrichten:**

1. [Discord Developer Portal](https://discord.com/developers/applications) → „New Application".
2. Reiter „OAuth2" → Client-ID und Client-Secret kopieren (→ `DISCORD_CLIENT_ID` / `DISCORD_CLIENT_SECRET`).
3. Dort unter „Redirects" die URL `https://deine-domain.de/api/auth/discord/callback` (bzw. für lokale
   Entwicklung `http://localhost:3000/api/auth/discord/callback`) eintragen und exakt so auch als
   `DISCORD_REDIRECT_URI` setzen.
4. Eigene Discord-Nutzer-ID ermitteln: Discord-Einstellungen → „Erweitert" → „Entwicklermodus" aktivieren, dann
   Rechtsklick auf den eigenen Namen → „Nutzer-ID kopieren" → als `OWNER_DISCORD_ID` setzen.
5. Für die Willkommens-DM (optional): Reiter „Bot" → „Add Bot" → Token kopieren (→ `DISCORD_BOT_TOKEN`). Den Bot
   anschließend über den OAuth2-URL-Generator (Scope `bot`, keine besonderen Berechtigungen nötig) auf euren
   Discord-Server einladen — **der Bot muss mit dem jeweiligen Mitarbeiter mindestens einen Server gemeinsam
   haben**, sonst lehnt Discord die DM ab (Plattform-Limitierung, keine Einstellung dieser App).

Ohne `DISCORD_CLIENT_ID`/`DISCORD_CLIENT_SECRET`/`DISCORD_REDIRECT_URI` zeigt `/api/auth/discord/login` einen
sprechenden Konfigurationsfehler statt eines Redirects — der Mitarbeiterbereich bleibt dann für alle, inklusive
der Geschäftsführung, unzugänglich.

Dieselbe Discord-Anwendung/dieselbe Redirect-URI bedient auch das Bestandskunden-Login unter `/kunden/login`
(`GET /api/auth/discord/login?purpose=customer`) — es muss dafür **nichts** zusätzlich in Discord eingerichtet
werden. Der signierte OAuth-„state" trägt den `purpose` mit, der Callback prüft je nachdem gegen `employees` oder
gegen `customers` und setzt die jeweils passende, komplett getrennte Session (siehe „Internes Dispositionssystem
für Bestandskunden" unten).

### Willkommens-DM bei Kontoerstellung

Sobald die Geschäftsführung ein neues Mitarbeiter-Konto anlegt, verschickt der Server automatisch eine
Discord-Direktnachricht an die hinterlegte Discord-Nutzer-ID mit Name, Rolle und einem direkten Link zum Login
(`https://baltic-freight.de/mitarbeiter/login`, `src/lib/server/discord-bot.ts`). Schlägt der Versand fehl (z. B.
`DISCORD_BOT_TOKEN` fehlt, oder der Bot teilt keinen Server mit der Person), wird das Konto trotzdem ganz normal
angelegt — die Geschäftsführung bekommt in der Liste lediglich einen Hinweis, dass die DM nicht zugestellt werden
konnte, und kann den Link bei Bedarf manuell weitergeben.

### Mitarbeiter-Konten anlegen (nur Geschäftsführer/Prokurist)

Unter Verwaltung → **„Mitarbeiter-Konten"** kann die Geschäftsführung neue Konten für Mitarbeitende
anlegen, bearbeiten und löschen — Benutzername (intern), Discord-Nutzer-ID, Discord-Benutzername (nur zur
Anzeige), Name, Abteilung sowie eine **feste Rolle** (Geschäftsführer, Prokurist, Betriebsleiter, Chefdisponent,
Disponent, Lager, Fuhrpark & Werkstatt, Buchhaltung oder Fahrer), die automatisch dieselben Modul-Berechtigungen
wie oben vergibt (`src/lib/roles.ts`). Ein neues Fahrer-Konto bekommt beim Anlegen automatisch eine leere
Fahrerkarte, damit die digitale Fahrerkarte sofort funktioniert. Ohne eingetragene Discord-Nutzer-ID kann sich
das Konto nicht einloggen — das wird in der Liste farblich hervorgehoben.

Zusätzlich lassen sich die **Führerscheinklassen** (Klasse C, Klasse CE, Gefahrgut, Schwertransport —
`src/lib/roles.ts`, `driverLicenseLabels`) direkt beim Anlegen ankreuzen und später jederzeit wieder ändern. Bei
einem mit dem Tablet verknüpften Konto (`tabletEmployeeId` gesetzt) wird eine Änderung zusätzlich als
`update_driver_permissions`-Befehl an das Tablet gemeldet (siehe „Tablet-Sync" unten) — dort ersetzt sie die
Führerscheinklassen des Fahrers vollständig (kein inkrementelles Hinzufügen).

Konten liegen serverseitig im Store (`employees`-Collection in `.data/db.json`), die Verwaltung läuft über
`src/app/api/employees/*`.

### Personalakten (nur Geschäftsführer/Prokurist)

Eigenes Sidebar-Modul **„Personalakten"** (`/mitarbeiter/personalakten`, `src/lib/employee-nav.ts`) — bewusst
kein Reiter unter Verwaltung, sondern ein eigenständiges, über `roleModuleAccess` geschütztes Modul, das
nur Geschäftsführer und Prokurist in der Sidebar sehen und öffnen können (Route-Guard in `DashboardShell`
leitet bei direktem Aufruf durch andere Rollen zur Übersicht um). Jedes Mitarbeiter-Konto legt automatisch eine
eigene Akte an (1:1, `personnelFiles`-Collection) — sowohl neu angelegte Konten als auch die Seed-Konten beim
ersten Start. Eine Akte enthält persönliche Daten (Geburtsdatum/-ort, Staatsangehörigkeit, Adresse, private
Telefonnummer/E-Mail), Beschäftigungsdaten (Eintrittsdatum, Beschäftigungsart), Krankenkasse und IBAN sowie ein
freies Notizfeld — alles direkt in der Akte editierbar. Zusätzlich lassen sich beliebige Dateien hochladen
(z. B. Ausweiskopie) und einzeln wieder löschen.

Die Datei-Metadaten (Name, Typ, Größe, Zeitpunkt) liegen in `.data/db.json`, die hochgeladenen Bytes selbst
liegen separat unter `.data/uploads/` (ebenfalls git-ignoriert), referenziert über eine zufällige Datei-ID —
nie über den vom Nutzer angegebenen Dateinamen, damit ein präparierter Dateiname keinen Zugriff auf andere
Pfade auf dem Server bekommt. Uploads sind auf 20 MB pro Datei begrenzt. Wird ein Mitarbeiter-Konto gelöscht,
werden seine Personalakte und alle zugehörigen Dateien mit gelöscht (`src/app/api/personnel-files/*`,
`src/lib/server/store.ts`).

**Wichtig**: Personalakten enthalten weiterhin sensible Daten (Geburtsdatum, Adresse, IBAN). Es gilt dieselbe
Einschränkung wie für den Rest der Seite — siehe „Wichtige Hinweise vor dem produktiven Einsatz" unten: Es gibt
**keine** serverseitige Zugriffsprüfung auf die `/api/personnel-files/*`-Routen, nur das clientseitig verlinkte
Modul ist an die Rollen Geschäftsführer/Prokurist gebunden.

**Automatischer Arbeitsvertrag**: Sobald alle Felder einer Akte (außer dem freien Notizfeld) ausgefüllt sind,
erzeugt der Server beim nächsten Speichern automatisch ein Arbeitsvertrag-PDF (`src/lib/server/contract-pdf.ts`,
Briefkopf mit Firmenname/-adresse/-logo aus den Unternehmensdaten), legt es als Dokument in der Akte ab und
schickt es dem Mitarbeitenden per Discord-DM als Anhang (`sendDiscordDmWithFile` in
`src/lib/server/discord-bot.ts`). Das passiert nur **einmal** pro Akte (`contractGeneratedAt`-Zeitstempel) —
spätere Änderungen an bereits vollständigen Akten lösen keine erneute Erstellung aus. Schlägt der DM-Versand
fehl, bleibt das erzeugte PDF trotzdem in der Akte hinterlegt und kann manuell heruntergeladen werden. Das
Vertragslayout ist ein generisches Template für eine fiktive Spedition (kein rechtsgeprüftes Dokument) mit 14
Vertragsparagraphen (Tätigkeit, Beginn/Probezeit, Arbeitszeit, Vergütung, Urlaub, Krankmeldung, Nebentätigkeiten,
Pflichten beider Seiten, Verschwiegenheit, Haftung, Kündigung, Schlussbestimmungen) sowie einem gebrandeten
Deckblatt mit „Auf einen Blick"-Infokarte (Position, Abteilung, Beschäftigung, Beginn); Firmenname, -adresse und
-logo dafür pflegt die Geschäftsführung unter Verwaltung → Unternehmensdaten.

Über den Button **„Arbeitsvertrag neu erstellen"** in der jeweiligen Akte lässt sich jederzeit manuell ein neuer
Arbeitsvertrag mit den aktuellen Daten erzeugen — z. B. nach einer Beförderung, wenn sich Rolle oder Abteilung
geändert haben. Anders als die automatische Erstellung ist dieser Button nicht an Vollständigkeit oder
`contractGeneratedAt` gebunden und kann beliebig oft ausgelöst werden; jeder neue Vertrag wird zusätzlich (nicht
überschreibend) als eigenes Dokument in der Akte abgelegt und per Discord-DM verschickt (`POST
/api/personnel-files/[employeeId]/contract`, gemeinsame Logik mit der Automatik in
`src/lib/server/contract-generation.ts`).

### Bewerbungen (nur Geschäftsführer/Prokurist)

Das öffentliche Bewerbungsportal (`/bewerbung`) hat jetzt ein echtes Backend: eingehende Bewerbungen landen
serverseitig gespeichert (`applications`-Collection) im gleichnamigen Dashboard-Reiter. Die Liste zeigt zu jeder
Bewerbung Name, Position, Discord-ID, Eingangsdatum und Status; ein **„Anzeigen"**-Button öffnet die vollständige
Bewerbung (Kontakt, Nachricht, Lebenslauf-Download, Status) in einem eigenen Browser-Tab
(`src/app/mitarbeiter/(dashboard)/bewerbungen/[id]/`).

Das Formular selbst verlangt jetzt zusätzlich eine **Discord-Nutzer-ID** (Pflichtfeld) und zeigt einen großen,
nicht zu übersehenden Hinweis, dass Bewerber:innen auf unserem Discord-Server sein müssen
(https://discord.gg/eUyQtdRbWm) — ohne das kann der Bot ihnen später keine Nachrichten schicken. Ändert
Geschäftsführung/Prokurist den Status einer Bewerbung (Neu/In Prüfung/Eingeladen/Angenommen/Abgelehnt), verschickt
der Bot automatisch eine Discord-DM mit einem zum neuen Status passenden Text (`buildApplicationStatusDm` in
`src/lib/server/discord-bot.ts`) — genau wie bei der Willkommens-DM setzt das `DISCORD_BOT_TOKEN` voraus; ohne
Token schlägt nur der DM-Versand fehl, die Statusänderung selbst wird trotzdem gespeichert. Ein hochgeladener
Lebenslauf liegt wie Personalakten-Dokumente als eigene Datei unter `.data/uploads/` (max. 10 MB, PDF).

Wird der Status auf **„Eingeladen"** oder **„Angenommen"** gesetzt, öffnet sich vorher ein Dialog zur Eingabe von
Datum und Uhrzeit (`src/components/employee/application-schedule-dialog.tsx`) — ohne Angabe lässt sich der Status
nicht setzen (serverseitig erzwungen in `PATCH /api/applications/[id]`, nicht nur im UI). Termin und Uhrzeit
werden direkt in den DM-Text übernommen („Termin: …" bei Eingeladen, „Dein Starttermin: …" bei Angenommen) und
zusätzlich auf der Bewerbung gespeichert (`scheduledAt`) — sichtbar in der Detailansicht unter „Termin" bzw.
„Starttermin". Wechselt der Status später auf etwas anderes, wird `scheduledAt` wieder geleert.

### Anfragen (Kontaktformular, nur Geschäftsführung/Prokurist/Betriebsleitung/Disposition)

Das Kontaktformular auf `/standort` hatte bisher **kein** Backend — Nachrichten verschwanden nach dem Absenden
spurlos, ohne dass sie irgendwo einsehbar waren. Jetzt landen sie serverseitig (`contactInquiries`-Collection) im
Dashboard-Reiter „Anfragen", der nach demselben Muster wie „Bewerbungen" aufgebaut ist: eine Liste mit
**„Anzeigen"**-Button, der die vollständige Anfrage in einem eigenen Browser-Tab öffnet
(`src/app/mitarbeiter/(dashboard)/anfragen/[id]/`). Wie beim Bewerbungsformular verlangt auch das Kontaktformular
jetzt eine **Discord-Nutzer-ID** (Pflichtfeld) und zeigt denselben großen Discord-Hinweis
(https://discord.gg/eUyQtdRbWm).

Anders als bei Bewerbungen gibt es hier **keinen** Status mit festen Texten — in der Detailansicht schreibt die
Geschäftsführung/Disposition den Antworttext frei selbst, der Bot verschickt ihn dann 1:1 (mit kurzer
Begrüßung/Absender drumherum, siehe `buildContactReplyDm` in `src/lib/server/discord-bot.ts`) als Discord-DM. Jede
verschickte Antwort wird mit Zeitstempel und Absender in der Anfrage protokolliert (`POST
/api/contact/[id]/reply`), sodass sich mehrere Antworten im Verlauf nachvollziehen lassen.

### Fahrer-Login → Fahrzeug → Disposition (echt, geräteübergreifend)

Ein `fahrerX`-Konto muss sich nach dem Login zunächst auf ein freies, einsatzbereites Fahrzeug anmelden
(„Fahrzeug-Gate", blockiert bis dahin den gesamten restlichen Mitarbeiterbereich). Diese Anmeldung läuft über die
Server-API (`src/app/api/vehicles/*`) mit einem dateibasierten Store (`.data/db.json`, git-ignoriert) — dadurch
sehen Disponenten auf einem **anderen Gerät/Tab** die Anmeldung live (Polling alle 4 s) im Bereich „Aktive
Fahrzeuge" und können neue Aufträge anlegen sowie live angemeldeten Fahrzeugen/Fahrern zuweisen.

**Für mit dem FiveM Speditions-Tablet verknüpfte Fahrzeuge** (`tabletVehicleId` gesetzt) übernimmt „Aktive
Fahrzeuge" den echten Ingame-Stand: Fahrerkarte einstecken/abziehen bzw. eine Fuhrpark-Zuweisung im Spiel pusht
den zugewiesenen Fahrer per `vehicle.upsert`-Webhook (`driverName`/`activeSince`, siehe „Tablet-Sync" unten,
Tablet-Version ab 1.9.0) — die eigene Website-Anmeldung oben bleibt nur für Fahrzeuge ohne Tablet-Verknüpfung
relevant.

### Auftragspool (Disposition, Chefdisponent, Betriebsleiter, Geschäftsführer/Prokurist)

Eigener Reiter neben Disposition: zeigt ausschließlich Aufträge, die im FiveM Speditions-Tablet neu im offenen
Pool gelandet sind (automatisch generiert oder über „Neuer Auftrag" mit „Auch im Tablet-Spiel anlegen" auf der
Website erzeugt) und noch **weder Fahrzeug noch Fahrer** zugewiesen bekommen haben — die reguläre
Disposition-Tabelle zeigt daneben auch bereits laufende/abgeschlossene Aufträge, dieser Reiter ist bewusst auf
„muss jetzt disponiert werden" verengt. Eine Fahrzeugauswahl pro Zeile löst denselben `assign_order`-Befehl wie
in der Disposition aus (siehe „Tablet-Sync" unten) — die Zuweisung kommt dadurch direkt im Spiel beim gewählten
Fahrzeug/Fahrer an, ganz ohne dass jemand im Spiel selbst disponieren muss. Setzt voraus, dass das Tablet neu
generierte Pool-Aufträge pusht (`Orders.GenerateOne`/`Orders.CreateFromWebsite` im Tablet-Repo, ab Version
1.9.0) — mit einer älteren Tablet-Version bleibt der Pool leer, bis dort disponiert wird.

### Benachrichtigungen (Glocke oben rechts im Dashboard)

Pollt alle 6 s `GET /api/notifications` (`src/components/employee/notification-bell.tsx`) und zeigt neue,
ungelesene Einträge mit rotem Zähler und einem kurzen Signalton (Web Audio, kein Audio-Asset nötig) an — der Ton
spielt nur bei tatsächlich **neuen** ungelesenen Einträgen, nicht beim ersten Laden der Seite mit bereits
offenen Altmeldungen. Ausgelöst wird eine Benachrichtigung bei:

- **Neuer Auftrag im Auftragspool** — an alle Rollen mit Zugriff auf Disposition/Auftragspool.
- **Auftrag mir zugewiesen** — nur an den konkreten Fahrer, dessen Name das Tablet als `driverName` meldet.
- **Neue Bewerbung** — an Geschäftsführer/Prokurist (dieselben Rollen, die auch den Reiter „Bewerbungen" sehen).
- **Neue Anfrage** (Kontaktformular) — an alle Rollen mit Zugriff auf „Anfragen".
- **Neuer Auftrag von einem Bestandskunden** (`/kunden`-Login) — an alle Rollen mit Zugriff auf Disposition.

Jede Benachrichtigung ist als „gelesen" pro Mitarbeitername markierbar (einzeln per Klick, oder „Alle als
gelesen markieren") und verlinkt direkt auf die zuständige Seite. Die Ziel-Rollen je Typ werden nicht separat
gepflegt, sondern aus `roleModuleAccess` (`src/lib/roles.ts`) abgeleitet (`src/lib/server/store.ts`,
`DISPATCH_NOTIFICATION_ROLES`/`APPLICATION_NOTIFICATION_ROLES`/`INQUIRY_NOTIFICATION_ROLES`) — ändert sich dort
der Modulzugriff einer Rolle, zieht die Benachrichtigungs-Zielgruppe automatisch nach.

### Digitale Fahrerkarte

Fahrer aktivieren ihre eigene Fahrerkarte und erfassen Pausen (Start/Ende) selbst; Lenkzeiten heute/Woche werden
gegen die gesetzlichen Grenzwerte (9 h/Tag, 56 h/Woche) angezeigt. Chefdisponent, Betriebsleiter und
Geschäftsführer sehen **alle** Fahrerkarten auf einen Blick, farblich markiert bei Überschreitung, und können pro
Fahrer eine Erinnerung senden — die dem Fahrer als Banner auf seiner Fahrerkarte erscheint, bis er sie bestätigt
(`src/app/api/driver-cards/route.ts`).

Es gibt **keine** feste Fahrer-Liste mehr: eine Fahrerkarte wird automatisch für jeden echten Mitarbeiter mit
Rolle „Fahrer" angelegt (und bei Umbenennung/Rollenwechsel/Löschung automatisch nachgeführt bzw. entfernt) — das
war früher eine fest einprogrammierte Demo-Besetzung („Lukas Schmidt" & Co.), die inzwischen ersatzlos entfernt
wurde. Meldet sich ausnahmsweise jemand ohne Rolle „Fahrer" an einem Fahrzeug an (z. B. Geschäftsführung, die
eine Schicht übernimmt), bekommt auch diese Person automatisch eine Fahrerkarte, die dann dauerhaft erhalten
bleibt (`src/lib/server/store.ts`, Abschnitt „Driver cards must reflect real employees…").

**Für ein mit dem FiveM Speditions-Tablet verknüpftes Konto** (`tabletEmployeeId` gesetzt) ist die Fahrerkarte
**tablet-gesteuert**: „Fahrerkarte aktivieren/deaktivieren" und „Pause starten/beenden" sind dort ausgeblendet
(Hinweistext statt Button) — Aktiv-Status kommt vom Fahrerkarte-Einstecken/Abziehen im Spiel, Pause vom Verlassen
des Fahrersitzes, jeweils per `driver_shift.update`/`driver_hours.report`-Webhook (siehe „Tablet-Sync" unten). Die
Lenkzeit heute kommt 1:1 vom Tablet; die Lenkzeit dieser Woche berechnet die Website selbst aus den täglichen
Meldungen (das Tablet führt dafür keine eigene Wochenhistorie) — siehe Einschränkungen im Tablet-Sync-Abschnitt.
Ein Konto ohne Tablet-Verknüpfung nutzt weiterhin die eigenen Website-Buttons wie bisher.

### Auftragsanfragen von der Website

Über „Auftrag einreichen" eingehende Anfragen landen mit Status „Angefragt" direkt bei der Disposition
(Panel „Neue Anfragen von der Website"), die sie annehmen (inkl. Bestätigung des Liefertermins) oder ablehnen
kann. Jeder Auftrag in der Disposition lässt sich zudem über einen „Löschen"-Button je Zeile endgültig entfernen
(`DELETE /api/orders/[id]`). Bei einem `origin: "tablet"`-Auftrag zeigt dieser Button, solange der Auftrag im
Spiel noch läuft, stattdessen „Im Spiel abbrechen" (siehe „Tablet-Sync" unten); erst sobald er dort einen
Endstatus erreicht hat (Zugestellt/Abgelehnt), wird daraus „Aus der Liste entfernen" — ein reiner
Website-seitiger Löschvorgang ohne Tablet-Befehl, weil im Spiel für diesen Auftrag ohnehin nichts mehr passiert.

Zusätzlich räumt sich die Disposition bei jedem Tablet-Ressourcenstart automatisch auf: Aufträge, die im Spiel
beim Neustart zurückgesetzt wurden (`orders.reset`-Webhook, siehe „Tablet-Sync" unten), verschwinden auch aus
der Website — ohne das blieben automatisch generierte oder im Spiel abgebrochene Aufträge für immer als
Karteileichen stehen.

### Aktuelle Aufträge & Chat mit der Disposition

Fahrer sehen unter „Aktuelle Aufträge" nur die ihnen zugewiesenen Aufträge mit allen Infos (Route, Termin,
Hinweise) und einen Chat-Thread je Auftrag. Die Disposition kann denselben Thread pro Zeile in der
Auftragstabelle aufklappen und antworten (`src/components/employee/order-chat.tsx`).

### Verwaltung (nur Geschäftsführer/Prokurist)

Eigener Reiter zur Pflege **aller** öffentlichen Inhalte — News, Stellenangebote, Leistungen, Geschäftsführung,
Wichtige Positionen, Fuhrpark-Kategorien, Rezensionen, Partner sowie Unternehmensdaten (Adresse, Telefon,
E-Mail, **Firmenlogo** …). Änderungen erscheinen sofort auf der öffentlichen Website, ganz ohne Neustart/Deploy
(`src/app/mitarbeiter/(dashboard)/verwaltung/`, generische CRUD-API unter `src/app/api/admin/[collection]/*`).
Das Firmenlogo unter „Unternehmensdaten" (als Bild hochgeladen, max. 1,5 MB, als eigene Datei unter
`.data/uploads/company-logo` hinterlegt — nur ein kleiner Verweis `logoMimeType` steht in `.data/db.json`, siehe
„Firmenlogo"-Hinweis unten) erscheint automatisch im Briefkopf generierter Dokumente wie dem Arbeitsvertrag
(siehe „Personalakten" oben). Dort lässt sich unter „Erreichbarkeit" außerdem eine frei editierbare Liste von
Zeile-für-Zeile-Öffnungszeiten pflegen (Tag + Uhrzeit, beliebig viele Zeilen hinzufügen/entfernen) — sie erscheint
1:1 auf der öffentlichen Seite „Standort". Die frühere eingebettete Karte auf „Standort" wurde ersatzlos entfernt
(zusammen mit dem dafür genutzten `mapsQuery`-Feld).

**Wichtig für eigenes Hosting hinter nginx**: nginx blockt standardmäßig alle Uploads über 1 MB mit „413 Request
Entity Too Large", **bevor** die Anfrage überhaupt bei dieser App ankommt (betrifft Logo-Upload und
Personalakten-Dokumente). Die nginx-Konfiguration in beiden Hosting-Anleitungen (`STRATO-HOSTING.md`,
`LIVING-BOTS-HOSTING.md`) enthält dafür `client_max_body_size 25M;` — falls dein Server schon vor dieser
Änderung eingerichtet wurde, musst du diese Zeile manuell in deine bestehende nginx-Config eintragen (üblicherweise
`/etc/nginx/sites-available/baltic-freight`) und danach `nginx -t && systemctl reload nginx` ausführen.

**Hinweis zum Impressum**: Die Angaben unter „Rechtliches" (Impressum, Datenschutz) sind bewusst **nicht** über
die Verwaltung editierbar, sondern fest in `src/lib/data.ts` (`legalContact`) hinterlegt. Sie zeigen die
real verantwortliche Person, unabhängig vom fiktiven Firmennamen „Baltic Freight GmbH", der über die
Verwaltung gepflegt wird (§5 TMG verlangt eine echte, identifizierbare verantwortliche Person/Adresse).

### Lagerverwaltung & Inventuren

Artikel (SKU, Name, Lagerort, Bestand, Mindestbestand) werden serverseitig gespeichert (`stockItems`-Collection)
und starten leer, bis welche angelegt werden. Eine Inventur zählt die Bestände neu und setzt den Zeitstempel
„Letzte Inventur" — beides bleibt über Neustarts hinweg erhalten (`src/app/api/stock/*`).

### Digitales Fahrtenbuch

Fahrten (Datum, Fahrer, Fahrzeug, Strecke, km-Stände, Zweck) werden serverseitig gespeichert und starten leer.
Fahrer- und Fahrzeugauswahl im Erfassungsformular kommen live aus den echten Mitarbeiter-Konten (Rolle „Fahrer")
und dem echten Fuhrpark, nicht aus einer festen Liste (`src/app/api/trips/*`).

Jeder vom FiveM Speditions-Tablet abgeschlossene Frachtauftrag trägt sich automatisch als Fahrt ein
(`trip.report`-Webhook, siehe „Tablet-Sync" unten) — Start-/Zielort, Kilometerstand vor/nach der Fahrt, Fahrer
und Kennzeichen kommen dabei direkt vom Tablet, Zweck ist immer „Geschäftlich". Die Spalte „Herkunft" markiert
solche Einträge mit „Tablet"; manuell über das Formular erfasste Fahrten (z. B. private oder sonstige Fahrten
außerhalb des Tabletts) zeigen „Manuell" und bleiben weiterhin jederzeit frei editierbar/löschbar.

### Rechnungserstellung mit PDF-Export

Rechnungen werden serverseitig gespeichert (`invoices`-Collection, starten leer) und lassen sich mit Positionen
kalkulieren, deren Zahlungsstatus (Offen/Bezahlt/Überfällig) direkt in der Liste ändern, endgültig **löschen**
und zusätzlich direkt als PDF herunterladen (`src/lib/invoice-pdf.ts`, via `jspdf`) — sowohl beim Erstellen als
auch nachträglich aus der Liste (`src/app/api/invoices/*`).

Der Kunde wird beim Erstellen nur noch aus dem Kundenstammbaum **ausgewählt** (kein Freitextfeld mehr); Kundenname
und Kundennummer werden zum Erstellungszeitpunkt in die Rechnung übernommen, sodass sie auch dann noch lesbar
bleibt, wenn der Kunde später umbenannt oder gelöscht wird. Der Sachbearbeiter wird automatisch aus dem
angemeldeten Mitarbeiter-Konto übernommen. Sowohl die Rechnungsliste als auch das PDF zeigen mindestens
Rechnungsnummer, Datum, Sachbearbeiter und Kundennummer. Das PDF-Layout orientiert sich bewusst am
Arbeitsvertrag (siehe „Personalakten" oben): gebrandete Seitenleiste, getönter Briefkopf und eine
„Auf einen Blick"-Infokarte mit genau diesen vier Angaben (`src/lib/invoice-pdf.ts`); anders als der serverseitig
erzeugte Arbeitsvertrag läuft die PDF-Erzeugung hier im Browser, das Firmenlogo wird dafür per Fetch von
`/api/company/logo` nachgeladen.

### Kundenstammbaum

Eigener Reiter zur zentralen Pflege der Kundendaten (Firmenname, Ansprechpartner, Adresse, Kontakt, Notizen) —
jeder Kunde bekommt beim Anlegen automatisch eine fortlaufende Kundennummer (`K-0001`, `K-0002`, …). Sichtbar für
Geschäftsführung, Prokurist, Betriebsleitung und Disposition (Chefdisponent + Disponent), siehe Rollentabelle
oben (`src/app/mitarbeiter/(dashboard)/kundenstammbaum/`, `src/app/api/customers/*`).

Jeder Kunde hat zusätzlich ein Feld **Discord-Nutzer-ID** und eine Checkbox **„Freischalten für Internes
Dispositionssystem"** — zusammen schalten sie den Kunden für das Bestandskunden-Portal frei (siehe nächster
Abschnitt). Ohne beides bleibt der Kunde ausschließlich intern verwaltet, wie bisher.

### Internes Dispositionssystem für Bestandskunden (`/kunden`)

Freigeschaltete Bestandskunden loggen sich unter `/kunden/login` **mit Discord** ein und reichen darüber direkt
Aufträge bei der Disposition ein, statt das anonyme öffentliche Formular auf `/auftrag` zu nutzen — die
Portal-Startseite zeigt zusätzlich eine Übersicht ihrer eigenen bisherigen Aufträge samt Status
(`src/app/kunden/`).

**Technisch teilt sich das Portal den Discord-Login mit dem Mitarbeiterbereich** (ein und derselbe registrierte
Redirect-URI, `DISCORD_CLIENT_ID`/`DISCORD_CLIENT_SECRET`/`DISCORD_REDIRECT_URI` — kein zusätzlicher Discord-App-
Eintrag nötig). Der OAuth-„state"-Parameter trägt dafür einen signierten `purpose` (`employee` oder `customer`,
siehe `createOAuthState`/`verifyOAuthState` in `src/lib/server/session.ts`); `src/app/api/auth/discord/callback/`
schaut dort nach, ob gegen `employees` oder gegen `customers` geprüft werden soll (`verifyCustomerLogin` verlangt
zusätzlich `portalEnabled: true`), und setzt danach die passende, **eigene** Session (Cookie
`bf_customer_session`, komplett getrennt vom Mitarbeiter-Cookie `bf_session` — eine Kundensession ist niemals mit
einer Mitarbeitersession verwechselbar).

**Einzige Stelle in der App mit echter serverseitiger Zugriffsprüfung**: Anders als der ganze restliche
Mitarbeiterbereich (siehe „Wichtige Hinweise" unten — dort sind alle Nutzer intern und vertrauenswürdig) sind
Bestandskunden externe, sich gegenseitig fremde Parteien. `src/app/api/customer-portal/orders/route.ts` liest die
Kundensession serverseitig aus dem httpOnly-Cookie aus und liefert bzw. erzeugt ausschließlich Aufträge des
eingeloggten Kunden (`customerId` auf `OrderRecord`) — ein Kunde kann so niemals Aufträge anderer Kunden oder
anonyme Web-Anfragen einsehen. Von der Disposition aus sind diese Aufträge ganz normal in der gemeinsamen
Auftragsliste sichtbar (`origin: "kunde"`, neben `"web"` für anonyme und `"intern"` für von der Disposition selbst
angelegte Aufträge).

### Stempeluhr

Jeder Mitarbeiter stempelt sich selbst ein und aus; die Seite zeigt die eigene gearbeitete Zeit für heute, diese
Woche und diesen Monat (Wochenzählung Montag–Sonntag). Geschäftsführung, Prokurist und Betriebsleitung sehen
zusätzlich eine Team-Übersicht aller Mitarbeiter mit demselben Zeitraster. Die Zeiten werden aus einem einfachen
Ein-/Ausstempel-Protokoll je Mitarbeiter bei jedem Aufruf neu berechnet, nicht inkrementell mitgezählt
(`src/app/mitarbeiter/(dashboard)/stempeluhr/`, `src/app/api/timeclock/*`). Wie bei den Lenkzeiten der digitalen
Fahrerkarte ist das ein einfaches Arbeitszeit-Tool für dieses fiktive Setting, keine rechtssichere
Zeiterfassung.

Für ein mit dem Tablet verknüpftes Konto ist auch die Stempeluhr **tablet-gesteuert**: der eigene Ein-/Ausstempel-
Button ist ausgeblendet (Hinweistext statt Button), Status/Zeiten kommen stattdessen per `timeclock.update`-Webhook
direkt vom Tablet (siehe „Tablet-Sync" unten) — dort ist die Stempeluhr zusätzlich an die tatsächliche
Gehaltsauszahlung gekoppelt, während die Website-eigene Stempeluhr rein informativ ist. Ein Konto ohne
Tablet-Verknüpfung stempelt weiterhin ganz normal über die Website selbst ein/aus.

### Finanzbuchhaltung

Zeigt zwei unabhängige, nicht gegeneinander verrechnete Quellen:

- **Rechnungen (Erlöse)**: die auf die echten Rechnungsdaten beschränkte Übersicht (offene Forderungen, bezahlt
  gesamt, überfällige Rechnungen) wie bisher.
- **Ingame-Umsatz (Tablet-Firmenkonto)**: live gespiegeltes Firmenkonto des FiveM Speditions-Tablets — Saldo sowie
  eine Buchungsliste (Auftrags-Einnahmen, Aus-/Einzahlungen, Gehaltsauszahlungen), gepusht via `finance.transaction`
  (siehe „Tablet-Sync" unten). Ohne aktiven Website-Sync im Tablet (`Config.Website.enabled`) bleibt dieser
  Abschnitt leer, mit entsprechendem Hinweistext statt eines Fehlers.

Es gibt weiterhin **keine** erfundene Ausgaben-/Kassenbuchhaltung (Kraftstoff, Personal, Werkstatt) — beide
gezeigten Quellen sind echte Daten, keine Simulation.

### Fahrzeugverwaltung: Anlegen/Löschen

Nur die Geschäftsführung sieht in der Fahrzeugverwaltung zusätzlich ein Formular zum Anlegen neuer Fahrzeuge und
einen Löschen-Button je Zeile; alle anderen Rollen mit Zugriff auf dieses Modul sehen es weiterhin nur lesend.

## Tablet-Sync (FiveM Speditions-Tablet)

Diese Website kann mit dem separaten FiveM-Roleplay-Tablet (`speditions-tablet`, eigenes Repo) synchronisiert werden:
Aufträge/Disposition, Fuhrpark/Fahrzeuge, Fahrerkarte/Lenkzeiten, Stempeluhr, Fahrtenbuch sowie Mitarbeiterkonten.
Der Sync ist bewusst **gleichwertig in beide Richtungen** — weder das Tablet noch die Website ist die alleinige
Quelle der Wahrheit; beide Seiten können Aufträge/Fahrzeuge/Mitarbeiter anlegen bzw. bearbeiten, und die jeweils
andere Seite zieht nach. Eine Ausnahme sind Stempeluhr und Fahrerkarte: für ein Tablet-verknüpftes Konto ist dort
**ausschließlich das Tablet** die Quelle der Wahrheit (siehe „Stempeluhr"/„Digitale Fahrerkarte" oben) — die
Website übernimmt nur noch, statt eine zweite unabhängige Erfassung zu führen.

**Push (Tablet → Website)**: `POST /api/tablet/webhook` — das Tablet meldet Änderungen (`employee.upsert`,
`order.upsert`, `vehicle.upsert`, `driver_hours.report`, `driver_shift.update`, `timeclock.update`, `trip.report`,
`finance.transaction`, `locations.sync`, `orders.reset`) in Echtzeit. Verknüpfung läuft über
`tabletEmployeeId`/`tabletOrderId`/`tabletVehicleId` (bzw. das Kennzeichen bei Fahrzeugen) — bestehende Datensätze
werden aktualisiert, unbekannte neu angelegt. `locations.sync` ist ein Sonderfall: kein Datensatz-Upsert, sondern
meldet einmalig beim Tablet-Ressourcenstart die gültigen Standortnamen/Frachtarten
(`Config.Locations`/`Config.CargoTypes`) — Grundlage für die Standort-Auswahl bei "Neuer Auftrag" auf der Website
(`tabletLocations`/`tabletCargoTypes` in `db.json`, `GET /api/tablet-locations`).

- `order.upsert` — bei jeder Auftragsänderung im Tablet, **inklusive** eines neu im offenen Pool generierten
  Auftrags (ab Tablet-Version 1.9.0, siehe „Auftragspool" oben). Löst zwei Benachrichtigungen aus (siehe
  „Benachrichtigungen" oben): einen neuen, noch unzugewiesenen Pool-Auftrag an alle Dispositions-Rollen, und —
  sobald `driverName` neu gesetzt wird — eine gezielte „Dir wurde ein Auftrag zugewiesen" an genau diesen Fahrer.
- `orders.reset` (bei jedem Tablet-Ressourcenstart, ab Tablet-Version 1.10.1) trägt `survivingTabletOrderIds` —
  die `tabletOrderId` aller Aufträge, die den Neustart im Tablet überlebt haben: von der Website selbst
  angelegte UND bereits im Spiel abgeschlossene (ein Tablet mit älterer Version als 1.10.1 meldet hier nur die
  von der Website angelegten — abgeschlossene Aufträge werden dort weiterhin bei jedem Neustart gelöscht).
  `pruneStaleTabletOrders` entfernt daraufhin jeden `origin: "tablet"`-Auftrag, der NICHT in dieser Liste steht —
  ohne das blieben automatisch generierte, unbearbeitete oder im Spiel abgebrochene Aufträge nach jedem Neustart
  für immer in der Disposition stehen, obwohl sie im Tablet längst gelöscht sind.
- `vehicle.upsert` trägt seit Tablet-Version 1.9.0 zusätzlich `driverName`/`activeSince` mit (aktuelle
  Fahrzeug-Fahrer-Zuweisung aus dem Spiel, siehe „Fahrer-Login → Fahrzeug → Disposition" oben) — mit einer
  älteren Tablet-Version bleiben diese beiden Felder leer und „Aktive Fahrzeuge" zeigt für Tablet-Fahrzeuge
  nichts an.
- `driver_hours.report` (periodisch, alle `Config.Website.driverHoursReportIntervalMs`) aktualisiert
  `drivingTodayMinutes`/`onBreak`/`breakStartedAt` der Fahrerkarte (`applyDriverHoursReport`); `drivingWeekMinutes`
  hat auf dem Tablet keine Entsprechung (dort nur Tageshistorie) und wird stattdessen serverseitig auf der Website
  hochgerechnet, indem beim erkannten Tageswechsel der letzte Tageswert in die Wochensumme einfließt (Reset jeweils
  Montag, nach der Systemuhr des Website-Servers — bei stark unterschiedlichen Zeitzonen zum Tablet-Server kann das
  um wenige Stunden abweichen).
- `driver_shift.update` (bei jedem Fahrerkarte einstecken/abziehen) setzt `active` auf der Fahrerkarte
  (`applyDriverShiftUpdate`) — ersetzt für Tablet-verknüpfte Fahrer den eigenen Website-Button.
- `timeclock.update` (bei jedem Ein-/Ausstempeln, auch beim automatischen Schließen+Neustart einer Session während
  einer Tablet-Gehaltsauszahlung) spiegelt den Stempeluhr-Status (`applyTimeclockUpdate`) — ersetzt für
  Tablet-verknüpfte Mitarbeiter den eigenen Website-Button.
- `trip.report` (bei jedem im Tablet abgeschlossenen Frachtauftrag) legt automatisch einen Fahrtenbuch-Eintrag an
  oder aktualisiert ihn (`upsertTripFromTablet`), gekeyt auf `tabletOrderId` — ein erneuter Push (z. B. nach einem
  Tablet-Ressourcen-Neustart) erzeugt dadurch nie einen doppelten Eintrag.
- `finance.transaction` (bei JEDER Firmenkonto-Bewegung im Tablet — Finance.AddTransaction dort ist der einzige
  Schreibpfad, daher lückenlos für Auftrags-Einnahmen, Aus-/Einzahlungen und Gehaltsauszahlungen) legt einen Eintrag
  in `tabletTransactions` an (`upsertTabletTransactionFromTablet`, gekeyt auf `tabletTransactionId`) und
  aktualisiert den gecachten `tabletCompanyBalance`. Grundlage für den Abschnitt "Ingame-Umsatz" auf der
  Finanzbuchhaltung-Seite (`GET /api/finance/tablet`).

**Pull (Website → Tablet)**: Dispositionsaktionen landen nicht als direkter Datenbank-Patch, sondern in einer
Befehls-Queue (`POST /api/tablet/commands`) — das Tablet pollt `GET /api/tablet/commands` alle paar Sekunden, führt
den Befehl gegen seine eigene Datenbank aus und meldet das Ergebnis über `POST /api/tablet/commands/[id]/ack`
zurück. So braucht der Spielserver keinen offenen eingehenden Port. Befehlstypen:
- `assign_order`/`cancel_order` — auf einem `origin: "tablet"`-Auftrag (Fahrzeug zuweisen, im Spiel abbrechen).
- `create_order` — ein auf der Website neu angelegter (`intern`) Auftrag landet im offenen Tablet-Auftragspool;
  Start-/Zielort müssen dafür aus der `tabletLocations`-Auswahl stammen (Disposition → "Auch im Tablet-Spiel
  anlegen"), sonst kann das Tablet sie keinem echten Standort zuordnen.
- `update_vehicle` — eine Statusänderung an einem Tablet-verknüpften Fahrzeug (`tabletVehicleId` gesetzt, Reiter
  Fahrzeugverwaltung → Bearbeiten) wird auch im Tablet gesetzt; die Website kennt nur 2-3 grobe Werkstatt-Zustände,
  die auf die 5 feineren Tablet-Status abgebildet werden (`Einsatzbereit`→`verfuegbar`, alles andere→`wartung`).
- `create_employee` — ein neu angelegtes Website-Konto bekommt optional auch ein Tablet-Login (Passwort wird dafür
  beim Anlegen zusätzlich abgefragt, aber **nicht** auf der Website gespeichert). Setzt voraus, dass im
  Tablet-Rollen-Editor **genau eine** Tablet-Rolle der gewählten Website-Rolle zugeordnet ist — sonst meldet das
  Tablet einen Fehler zurück (asynchron, im `pendingCommands`-Ergebnis, nicht als Formular-Fehler sichtbar). Die
  beim Anlegen angekreuzten Führerscheinklassen werden dabei direkt mitgegeben.
- `update_driver_permissions` — eine Änderung an den Führerscheinklassen (Klasse C, Klasse CE, Gefahrgut,
  Schwertransport) eines bereits Tablet-verknüpften Kontos (`tabletEmployeeId` gesetzt) wird als vollständiger
  Abgleich ans Tablet gemeldet: die im Formular angekreuzten Klassen ersetzen dort komplett, was der Fahrer bisher
  hatte (kein inkrementelles Hinzufügen/Entfernen).

Alle `/api/tablet/*`-Routen prüfen einen `X-Api-Key`-Header gegen `TABLET_API_KEY` (konstante Zeit, siehe
`src/lib/server/tablet-auth.ts`) — die einzigen Routen in dieser App mit einem echten Auth-Gate, weil sie Schreibzugriffe
von einem externen, nicht-interaktiven Aufrufer akzeptieren statt einer angemeldeten Browser-Session. Ohne gesetzte
`TABLET_API_KEY` sind sie komplett gesperrt. `/api/tablet-locations` (Standort-Cache fürs Dispo-Formular) und
`GET /api/tablet/commands` als Enqueue-Ziel (`POST`) laufen dagegen über die normale, ungeschützte Dashboard-API
wie alle anderen internen Routen (siehe "Wichtige Hinweise" unten zur fehlenden serverseitigen Autorisierung).

**Bekannte Vereinfachungen**: Der Website-Auftragsstatus (`Angefragt/Neu/Disponiert/Unterwegs/Zugestellt/Abgelehnt`)
ist gröber als der des Tablets — eine Mapping-Funktion (`mapTabletOrderStatus` in `src/lib/server/store.ts`)
übersetzt zwischen beiden. Die wöchentliche Lenkzeit auf der Fahrerkarte wird nicht synchronisiert (das Tablet führt
dafür aktuell keine Historie). Die Sync-Schreibpfade (`upsertEmployeeFromTablet`, `upsertOrderFromTablet`,
`upsertVehicleFromTablet`, `applyDriverHoursReport`, die Command-Queue) sind über einen einfachen In-Process-Mutex
(`withSyncLock`) gegeneinander serialisiert, damit eine schnelle Folge von Webhook-Events sich nicht gegenseitig
überschreibt — das ist kein Ersatz für eine echte Transaktions-Datenbank, aber für den erwarteten Event-Takt
ausreichend (siehe Store-Kommentar zu `.data/db.json` weiter unten). Ein komplett **neues** Fahrzeug von der
Website aus im Spiel erscheinen zu lassen ist bewusst **nicht** umgesetzt (ein reales Fahrzeug braucht ein echtes
FiveM-Spawn-Modell/eine Garage, die die Website nicht validieren kann) — nur Statusänderungen an bereits
existierenden, Tablet-verknüpften Fahrzeugen gehen in beide Richtungen.

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
  Daten gelesen/geändert werden) — bei den Personalakten idealerweise als Erstes. Einzige Ausnahme ist bereits
  umgesetzt: `/api/customer-portal/orders` (Bestandskunden-Portal, siehe oben) prüft die Kundensession echt
  serverseitig, weil Bestandskunden externe, sich gegenseitig fremde Parteien sind — anders als die restlichen,
  hier als intern-vertrauenswürdig behandelten Mitarbeiter-Rollen.
- **Datenpersistenz**: Disposition, Fahrzeuge, Fahrerkarten, Aufträge/Chat, Lagerbestände, Fahrtenbuch, Rechnungen,
  Kundenstammbaum, Stempeluhr, Personalakten, Bewerbungen, Anfragen und alle Website-Inhalte laufen über einen
  dateibasierten Store (eine JSON-Datei auf dem Server, `src/lib/server/store.ts`) — funktional korrekt für eine
  Einzelserver-Demo, aber nicht nebenläufigkeitssicher und kein Ersatz für eine echte Datenbank. Regelmäßige
  Backups von `.data/db.json` **und** `.data/uploads/` (Personalakten-Dokumente, Bewerbungs-Lebensläufe) sind
  empfehlenswert (siehe Hosting-Anleitungen). Alle drei öffentlichen Formulare (Auftrag einreichen,
  Bewerbungsportal, Kontaktformular) haben inzwischen ein echtes Backend — keines davon ist mehr reine Mock-UI.
- **Rechtliche Angaben**: Handelsregisternummer/USt-ID sind bewusst nicht angegeben (siehe Hinweis auf der
  Impressum-Seite). Sollte sich das ändern, `src/lib/data.ts` (`legalContact`) sowie die Impressum-Seite
  entsprechend ergänzen und rechtlich prüfen lassen.
- **Lenkzeiten**: Neu angelegte Fahrerkarten starten bei 0 Minuten (heute/Woche/Pause) und füllen sich nur durch
  echte Nutzung (Aktivieren/Pausieren durch den Fahrer). Es gibt weiterhin **keine** automatische
  Tages-/Wochen-Rollover-Logik oder Anbindung an echte Fahrtenschreiber-/Telematikdaten — die Werte laufen so
  lange weiter, bis sie manuell/serverseitig zurückgesetzt werden.
