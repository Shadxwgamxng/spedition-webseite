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

**Demo-Zugänge** (Passwort jeweils `baltic2026`): `disposition`, `lager`, `fuhrpark`, `buchhaltung`, `admin`.

## Wichtige Hinweise vor dem produktiven Einsatz

Dies ist eine funktionale Frontend-Demo ohne eigenes Backend. Vor einem echten Launch sollte ergänzt werden:

- **Echte Authentifizierung**: Der Login ist aktuell eine clientseitige Demo (Konten im Code, Session in
  `localStorage`). Für den Produktivbetrieb wird eine serverseitige Authentifizierung mit sicherem
  Session-/Token-Handling und gehashten Passwörtern benötigt.
- **Datenpersistenz**: Disposition, Lager, Fuhrpark, Fahrtenbuch, Fahrerkarte, Rechnungen und Finanzbuchhaltung
  nutzen aktuell lokalen React-State mit Beispieldaten (kein Speichern, kein Mehrbenutzer-Sync). Für den
  produktiven Einsatz braucht es eine Datenbank/API-Anbindung.
- **Formulare**: „Auftrag einreichen“, das Kontaktformular und das Bewerbungsportal zeigen aktuell nur eine
  Erfolgsmeldung an; es wird noch keine E-Mail versendet oder Datei gespeichert. Hierfür wird ein Backend
  (API-Route + E-Mail-Versand bzw. Dateispeicher) benötigt.
- **Rechtliche Angaben**: Impressum und Datenschutzerklärung enthalten Platzhalter (z. B. Handelsregisternummer,
  USt-ID) und müssen vor Veröffentlichung durch echte Daten ersetzt und rechtlich geprüft werden.
- **Inhalte**: Firmendaten, Team, News, Fuhrpark, Stellenangebote, Rezensionen und Partner sind Beispielinhalte
  in `src/lib/data.ts` und sollten durch reale Unternehmensdaten ersetzt werden.
