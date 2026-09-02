# Baltic Freight GmbH – Speditions-Website

Moderne Unternehmenswebsite für die Baltic Freight GmbH (Falkenwalde) mit öffentlichem Bereich und einem
rollenbasierten, passwortgeschützten Mitarbeiterbereich. Gebaut mit Next.js (App Router), TypeScript und
Tailwind CSS.

## Erste Schritte

```bash
npm install
npm run dev
```

Öffne [http://localhost:3000](http://localhost:3000).

Weitere Befehle: `npm run build` (Produktions-Build), `npm start` (Produktions-Server), `npm run lint` (ESLint).

## Öffentlicher Bereich

Startseite, Unsere Leistungen, Über uns, Geschäftsführung, News, Fuhrpark, Standort, Stellenangebote,
Bewerbungsportal, Auftrag einreichen, Rezensionen, Partner sowie Impressum/Datenschutz (Platzhaltertexte).
Alle diese Inhalte kommen live aus dem Server-Store und lassen sich über die „Website-Verwaltung“ (siehe unten)
bearbeiten.

## Mitarbeiterbereich (`/mitarbeiter`)

Passwortgeschützter Bereich mit **rollenbasierter Sichtbarkeit** — jede Rolle sieht in Sidebar und Dashboard nur
ihre eigenen Module; ein direkter Aufruf einer nicht erlaubten URL wird zur Übersicht zurückgeleitet
(`src/lib/roles.ts`, durchgesetzt in `DashboardShell`).

**Demo-Zugänge** (Passwort jeweils `baltic2026`):

| Konto | Rolle | Sichtbare Module |
| --- | --- | --- |
| `admin` | Geschäftsführung | **Alles**, inkl. Website-Verwaltung; einzige Rolle mit Fahrzeuge anlegen/löschen |
| `disposition` | Disposition | Disposition, Fahrzeugverwaltung, Fahrerkarte (aller Fahrer, inkl. Erinnerungen senden) |
| `lager` | Lager | Lagerverwaltung & Inventuren |
| `fuhrpark` | Fuhrpark & Werkstatt | Fahrzeugverwaltung (nur lesend), Digitales Fahrtenbuch |
| `buchhaltung` | Buchhaltung | Rechnungserstellung (inkl. PDF-Export), Finanzbuchhaltung |
| `fahrer1` … `fahrer5` | Fahrer | Nur eigene Fahrerkarte + „Aktuelle Aufträge“ (Chat mit der Disposition) |

### Fahrer-Login → Fahrzeug → Disposition (echt, geräteübergreifend)

Ein `fahrerX`-Konto muss sich nach dem Login zunächst auf ein freies, einsatzbereites Fahrzeug anmelden
(„Fahrzeug-Gate“, blockiert bis dahin den gesamten restlichen Mitarbeiterbereich). Diese Anmeldung läuft über die
Server-API (`src/app/api/vehicles/*`) mit einem dateibasierten Store (`.data/db.json`, git-ignoriert) — dadurch
sehen Disponenten auf einem **anderen Gerät/Tab** die Anmeldung live (Polling alle 4 s) im Bereich „Aktive
Fahrzeuge“ und können neue Aufträge anlegen sowie live angemeldeten Fahrzeugen/Fahrern zuweisen.

### Digitale Fahrerkarte

Fahrer aktivieren ihre eigene Fahrerkarte und erfassen Pausen (Start/Ende) selbst; Lenkzeiten heute/Woche werden
gegen die gesetzlichen Grenzwerte (9 h/Tag, 56 h/Woche) angezeigt. Disposition und Geschäftsführung sehen **alle**
Fahrerkarten auf einen Blick, farblich markiert bei Überschreitung, und können pro Fahrer eine Erinnerung senden —
die dem Fahrer als Banner auf seiner Fahrerkarte erscheint, bis er sie bestätigt (`src/app/api/driver-cards/route.ts`).

### Aktuelle Aufträge & Chat mit der Disposition

Fahrer sehen unter „Aktuelle Aufträge“ nur die ihnen zugewiesenen Aufträge mit allen Infos (Route, Termin,
Hinweise) und einen Chat-Thread je Auftrag. Die Disposition kann denselben Thread pro Zeile in der
Auftragstabelle aufklappen und antworten (`src/components/employee/order-chat.tsx`).

### Website-Verwaltung (nur Geschäftsführung)

Eigener Reiter zur Pflege **aller** öffentlichen Inhalte — News, Stellenangebote, Leistungen, Geschäftsführung,
Wichtige Positionen, Fuhrpark-Kategorien, Rezensionen, Partner sowie Unternehmensdaten (Adresse, Telefon,
E-Mail …). Änderungen erscheinen sofort auf der öffentlichen Website, ganz ohne Neustart/Deploy
(`src/app/mitarbeiter/(dashboard)/verwaltung/`, generische CRUD-API unter `src/app/api/admin/[collection]/*`).

### Rechnungserstellung mit PDF-Export

Rechnungen lassen sich wie bisher mit Positionen kalkulieren und zusätzlich direkt als PDF herunterladen
(`src/lib/invoice-pdf.ts`, via `jspdf`) — sowohl beim Erstellen als auch nachträglich aus der Liste.

### Fahrzeugverwaltung: Anlegen/Löschen

Nur die Geschäftsführung sieht in der Fahrzeugverwaltung zusätzlich ein Formular zum Anlegen neuer Fahrzeuge und
einen Löschen-Button je Zeile; alle anderen Rollen mit Zugriff auf dieses Modul sehen es weiterhin nur lesend.

## Wichtige Hinweise vor dem produktiven Einsatz

Dies ist eine funktionale Demo mit einem schlanken eigenen Backend. Vor einem echten Launch sollte ergänzt werden:

- **Echte Authentifizierung & Autorisierung**: Der Login ist aktuell eine clientseitige Demo (Konten im Code,
  Session in `localStorage`, keine Passwort-Hashes, keine serverseitige Session-Prüfung). Die Rollenprüfung
  (`src/lib/roles.ts`) läuft ebenfalls nur clientseitig in der UI — die API-Routen unter `/api/*` prüfen aktuell
  **keine** Berechtigung und sind offen erreichbar. Für den Produktivbetrieb braucht es serverseitige
  Authentifizierung mit sicherem Session-/Token-Handling und serverseitig durchgesetzte Rollen/Rechte auf jeder
  API-Route (insbesondere `/api/admin/*`, `/api/vehicles` POST/DELETE, `/api/driver-cards`).
- **Datenpersistenz**: Disposition, Fahrzeuge, Fahrerkarten, Aufträge/Chat und alle Website-Inhalte laufen über
  einen dateibasierten Store (eine JSON-Datei auf dem Server, `src/lib/server/store.ts`) — funktional korrekt für
  eine Einzelserver-Demo, aber nicht nebenläufigkeitssicher und kein Ersatz für eine echte Datenbank. Lager,
  Fahrtenbuch und Finanzbuchhaltung nutzen weiterhin nur lokalen React-State mit Beispieldaten (kein Speichern).
- **Formulare**: „Auftrag einreichen“, das Kontaktformular und das Bewerbungsportal zeigen aktuell nur eine
  Erfolgsmeldung an; es wird noch keine E-Mail versendet oder Datei gespeichert. Hierfür wird ein Backend
  (API-Route + E-Mail-Versand bzw. Dateispeicher) benötigt.
- **Rechtliche Angaben**: Impressum und Datenschutzerklärung enthalten Platzhalter (z. B. Handelsregisternummer,
  USt-ID) und müssen vor Veröffentlichung durch echte Daten ersetzt und rechtlich geprüft werden.
- **Lenkzeiten**: Die Lenkzeit-Werte in der Fahrerkarte sind Beispieldaten und werden nicht automatisch aus realen
  Fahrten berechnet — eine echte Anbindung bräuchte Fahrtenschreiber-/Telematikdaten.
