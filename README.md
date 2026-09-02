# Baltic Freight GmbH – Speditions-Website

Moderne Unternehmenswebsite für die Baltic Freight GmbH (Falkenwalde) mit öffentlichem Bereich und
passwortgeschütztem Mitarbeiterbereich. Gebaut mit Next.js (App Router), TypeScript und Tailwind CSS.

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

## Mitarbeiterbereich (`/mitarbeiter`)

Passwortgeschützter Bereich mit Disposition, Lagerverwaltung & Inventuren, Fahrzeugverwaltung, digitalem
Fahrtenbuch, digitaler Fahrerkarte, Rechnungserstellung und Finanzbuchhaltung.

**Demo-Zugänge** (Passwort jeweils `baltic2026`): `disposition`, `lager`, `fuhrpark`, `buchhaltung`, `admin`
sowie `fahrer1` … `fahrer5` (je ein Konto pro Fahrer aus dem Fuhrpark-Beispieldatensatz).

### Fahrer-Login → Fahrzeugdisposition (echt, geräteübergreifend)

Meldet sich ein `fahrerX`-Konto an, muss es sich zunächst auf ein freies, einsatzbereites Fahrzeug einloggen
(„Fahrzeug-Gate“). Diese Anmeldung wird über eine kleine Server-API (`src/app/api/vehicles/*`,
`src/app/api/orders/*`) mit einem dateibasierten Store (`.data/db.json`, git-ignoriert) abgelegt — dadurch sehen
Disponenten auf einem **anderen Gerät/Tab** die Anmeldung live (Polling alle 4 s) im Bereich „Aktive Fahrzeuge“
der Disposition und können neue Aufträge anlegen sowie live angemeldeten Fahrzeugen/Fahrern zuweisen. Das ist
mehr als reine UI-Mock-Logik, aber weiterhin **kein produktionsreifes Backend** (siehe unten).

## Wichtige Hinweise vor dem produktiven Einsatz

Dies ist eine funktionale Demo mit einem sehr schlanken eigenen Backend. Vor einem echten Launch sollte ergänzt werden:

- **Echte Authentifizierung**: Der Login ist aktuell eine clientseitige Demo (Konten im Code, Session in
  `localStorage`, keine Passwort-Hashes, keine serverseitige Session-Prüfung). Für den Produktivbetrieb wird
  eine serverseitige Authentifizierung mit sicherem Session-/Token-Handling benötigt — insbesondere auch, um die
  API-Routen unter `/api/*` (aktuell ungeschützt) gegen unautorisierte Zugriffe abzusichern.
- **Datenpersistenz**: Disposition und Fahrzeuge/Fahrer-Login laufen über einen einfachen dateibasierten Store
  (eine JSON-Datei auf dem Server) — funktional korrekt für eine Einzelserver-Demo, aber nicht
  nebenläufigkeitssicher und kein Ersatz für eine echte Datenbank. Lager, Fahrtenbuch, Fahrerkarte, Rechnungen
  und Finanzbuchhaltung nutzen weiterhin nur lokalen React-State mit Beispieldaten (kein Speichern). Für den
  produktiven Einsatz braucht es durchgängig eine echte Datenbank/API-Anbindung.
- **Formulare**: „Auftrag einreichen“, das Kontaktformular und das Bewerbungsportal zeigen aktuell nur eine
  Erfolgsmeldung an; es wird noch keine E-Mail versendet oder Datei gespeichert. Hierfür wird ein Backend
  (API-Route + E-Mail-Versand bzw. Dateispeicher) benötigt.
- **Rechtliche Angaben**: Impressum und Datenschutzerklärung enthalten Platzhalter (z. B. Handelsregisternummer,
  USt-ID) und müssen vor Veröffentlichung durch echte Daten ersetzt und rechtlich geprüft werden.
- **Inhalte**: Firmendaten, Team, News, Fuhrpark, Stellenangebote, Rezensionen und Partner sind Beispielinhalte
  in `src/lib/data.ts` und sollten durch reale Unternehmensdaten ersetzt werden.
