# Baltic Freight GmbH – Speditions-Website

Unternehmenswebsite für die Baltic Freight GmbH (Falkenwalde) mit öffentlichem Bereich und einem
einfachen, passwortgeschützten Mitarbeiterbereich zur Pflege der Inhalte. Gebaut mit Next.js (App Router),
TypeScript und Tailwind CSS.

## Erste Schritte

```bash
npm install
npm run dev
```

Öffne [http://localhost:3000](http://localhost:3000).

Weitere Befehle: `npm run build` (Produktions-Build), `npm start` (Produktions-Server), `npm run lint` (ESLint).

Anleitung zum Hosten auf Strato: siehe [`STRATO-HOSTING.md`](./STRATO-HOSTING.md).

## Öffentlicher Bereich

Startseite, Unsere Leistungen, Über uns, Geschäftsführung, News, Fuhrpark, Standort, Stellenangebote,
Bewerbungsportal, Auftrag einreichen, Rezensionen, Partner sowie Impressum/Datenschutz.

Alle diese Inhalte kommen aus einem dateibasierten Server-Store (`src/lib/server/store.ts`, Daten in
`.data/db.json`, git-ignoriert), der beim ersten Start aus `src/lib/data.ts` befüllt wird — funktional korrekt
für eine Demo, aber nicht nebenläufigkeitssicher und kein Ersatz für eine echte Datenbank.

Aktuell leere Bereiche (News, Rezensionen, Fuhrpark-Kategorien) zeigen automatisch einen Platzhaltertext, bis
über die Website-Verwaltung echte Inhalte eingetragen werden.

## Mitarbeiterbereich (`/mitarbeiter`)

Ein einziger, gemeinsamer Login (kein Rollensystem) schützt die **Website-Verwaltung** — von dort lassen sich
News, Stellenangebote, Leistungen, Geschäftsführung, wichtige Positionen, Fuhrpark-Kategorien, Rezensionen,
Partner sowie die Unternehmensdaten (Adresse, Telefon, E-Mail …) direkt im Browser pflegen. Änderungen erscheinen
sofort live, ganz ohne Neustart/Deploy (`src/app/mitarbeiter/(dashboard)/verwaltung/`, generische CRUD-API unter
`src/app/api/admin/[collection]/*`).

Zugangsdaten stehen in `src/lib/auth.tsx` (`ADMIN_USERNAME` / `ADMIN_PASSWORD`) — dort auch änderbar.

**Hinweis zum Impressum**: Die Angaben unter „Rechtliches" (Impressum, Datenschutz) sind bewusst **nicht** über
die Website-Verwaltung editierbar, sondern fest in `src/lib/data.ts` (`legalContact`) hinterlegt. Sie zeigen die
real verantwortliche Person, unabhängig vom fiktiven Firmennamen „Baltic Freight GmbH", der über die
Website-Verwaltung gepflegt wird (§5 TMG verlangt eine echte, identifizierbare verantwortliche Person/Adresse).

## Wichtige Hinweise vor dem produktiven Einsatz

Dies ist eine funktionale Demo mit einem schlanken eigenen Backend. Vor einem echten Launch sollte ergänzt werden:

- **Echte Authentifizierung**: Der Login ist aktuell eine clientseitige Demo (ein festes Konto im Code, Session
  in `localStorage`, kein Passwort-Hash, keine serverseitige Session-Prüfung). Die API-Routen unter `/api/*`
  prüfen aktuell **keine** Berechtigung und sind offen erreichbar — für den Produktivbetrieb braucht es
  serverseitige Authentifizierung mit sicherem Session-/Token-Handling.
- **Datenpersistenz**: Alle Website-Inhalte laufen über einen dateibasierten Store (eine JSON-Datei auf dem
  Server, `src/lib/server/store.ts`) — funktional korrekt für eine Einzelserver-Demo, aber nicht
  nebenläufigkeitssicher und kein Ersatz für eine echte Datenbank. Regelmäßige Backups von `.data/db.json` sind
  empfehlenswert (siehe `STRATO-HOSTING.md`).
- **Formulare**: „Auftrag einreichen“, das Kontaktformular und das Bewerbungsportal zeigen aktuell nur eine
  Erfolgsmeldung clientseitig an; es wird noch keine E-Mail versendet, kein Auftrag gespeichert und keine Datei
  hochgeladen. Hierfür wird ein Backend (API-Route + E-Mail-Versand bzw. Dateispeicher) benötigt.
- **Rechtliche Angaben**: Handelsregisternummer/USt-ID sind bewusst nicht angegeben (siehe Hinweis auf der
  Impressum-Seite). Sollte sich das ändern, `src/lib/data.ts` (`legalContact`) sowie die Impressum-Seite
  entsprechend ergänzen und rechtlich prüfen lassen.
