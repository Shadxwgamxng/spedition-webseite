# Baltic Freight GmbH – Speditions-Website

Moderne, öffentliche Unternehmenswebsite für die Baltic Freight GmbH (Falkenwalde). Gebaut mit Next.js
(App Router), TypeScript und Tailwind CSS.

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

Alle diese Inhalte kommen aus einem dateibasierten Server-Store (`src/lib/server/store.ts`, Daten in
`.data/db.json`, git-ignoriert), der beim ersten Start aus `src/lib/data.ts` befüllt wird — funktional korrekt
für eine Demo, aber nicht nebenläufigkeitssicher und kein Ersatz für eine echte Datenbank/CMS-Anbindung.

## Wichtige Hinweise vor dem produktiven Einsatz

Dies ist eine funktionale Demo. Vor einem echten Launch sollte ergänzt werden:

- **Formulare**: „Auftrag einreichen“, das Kontaktformular und das Bewerbungsportal zeigen aktuell nur eine
  Erfolgsmeldung clientseitig an; es wird noch keine E-Mail versendet, kein Auftrag gespeichert und keine Datei
  hochgeladen. Hierfür wird ein Backend (API-Route + E-Mail-Versand bzw. Dateispeicher) benötigt.
- **Rechtliche Angaben**: Impressum und Datenschutzerklärung enthalten Platzhalter (z. B. Handelsregisternummer,
  USt-ID) und müssen vor Veröffentlichung durch echte Daten ersetzt und rechtlich geprüft werden.
- **Inhaltspflege**: Redaktionelle Inhalte (News, Stellenangebote, Team, Fuhrpark-Kategorien, Rezensionen,
  Partner, Unternehmensdaten) liegen aktuell als Seed-Daten in `src/lib/data.ts` und werden beim ersten Start in
  `.data/db.json` übernommen. Ohne eigenes Backend-Interface lassen sie sich nur durch Bearbeiten dieser Datei
  bzw. der JSON-Datei ändern.
