# Hosting auf Strato – Schritt-für-Schritt-Anleitung

Diese Website ist eine Next.js-Anwendung mit eigenem Server (API-Routen, serverseitig gerenderte Seiten). Das
funktioniert **nicht** auf klassischem Strato-„Webhosting" (reines PHP-Shared-Hosting) – dafür braucht es ein
Strato-Produkt mit Root-Zugriff und Node.js, z. B.:

- **Strato Node.js Hosting** (strato.de/server/node-js-hosting/), oder
- ein **Strato Linux V-Server / Root-Server** (Ubuntu oder Debian)

Empfehlung: mindestens **2 GB RAM** (für serverseitiges Rendering), 1 vCPU reicht für den Start.

Falls die Domain bereits bei Strato registriert ist, kann sie im selben Kundenkonto verwaltet werden – sie muss
später nur per DNS auf den neuen Server zeigen (Schritt 7).

---

## 1. Server bestellen & per SSH verbinden

1. Im Strato-Kundenpanel den Node.js-/V-Server bestellen (Ubuntu 22.04 oder 24.04 LTS empfohlen).
2. Nach der Einrichtung erhältst du die Server-IP sowie Zugangsdaten (root-Passwort oder SSH-Key) per E-Mail.
3. Verbinden:
   ```bash
   ssh root@DEINE-SERVER-IP
   ```

## 2. Node.js installieren

Am einfachsten über `nvm` (Node Version Manager), damit du die Node-Version unabhängig vom System aktuell halten
kannst:

```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh | bash
source ~/.bashrc
nvm install 22
nvm use 22
node -v   # sollte v22.x zeigen
```

(Next.js 16 benötigt mindestens Node 20.9 – Node 22 LTS ist eine sichere Wahl.)

## 3. Projekt auf den Server bringen

Am saubersten per Git (empfohlen, damit spätere Updates nur ein `git pull` sind):

```bash
apt update && apt install -y git
git clone https://github.com/<dein-github-name>/spedition-webseite.git
cd spedition-webseite
```

Alternativ per SFTP/`scp` das gesamte Projektverzeichnis hochladen (ohne `node_modules` und `.next` – die werden
auf dem Server neu gebaut).

## 4. Umgebungsvariablen für den Discord-Login einrichten

Der Mitarbeiterbereich wird ausschließlich über Discord-OAuth2 entsperrt (kein Passwort-Login mehr). Dafür im
Projektverzeichnis eine Datei `.env.local` anlegen (git-ignoriert, wird **nicht** mit hochgeladen/committet):

```bash
cat > .env.local << 'EOF'
DISCORD_CLIENT_ID=deine-discord-client-id
DISCORD_CLIENT_SECRET=dein-discord-client-secret
DISCORD_REDIRECT_URI=https://deine-domain.de/api/auth/discord/callback
SESSION_SECRET=eine-lange-zufaellige-zeichenkette
OWNER_DISCORD_ID=deine-eigene-discord-nutzer-id
EOF
```

Woher diese Werte kommen und wie du eine Discord-Anwendung dafür anlegst, steht ausführlich im
[`README.md`](./README.md) unter „Login: ausschließlich über Discord (OAuth2)". Wichtig:
`DISCORD_REDIRECT_URI` muss **exakt** der Redirect-URI entsprechen, die du im Discord Developer Portal
hinterlegst (mit `https://` und der echten Domain, nicht `localhost`). `OWNER_DISCORD_ID` wird nur beim
allerersten Start ausgelesen, um dein eigenes Geschäftsführungs-Konto zu verknüpfen.

## 5. Installieren & bauen

```bash
npm install
npm run build
```

`npm run build` erzeugt den optimierten Produktions-Build (`.next/`). Das dauert beim ersten Mal ein bis zwei
Minuten.

## 6. Dauerhaft laufen lassen mit PM2

Ohne einen Prozess-Manager stirbt der Server, sobald die SSH-Sitzung endet. **PM2** startet ihn automatisch neu
(auch nach einem Server-Reboot):

```bash
npm install -g pm2
pm2 start npm --name baltic-freight -- start
pm2 save
pm2 startup   # gibt einen Befehl aus, den du einmal kopierst & ausführst – aktiviert Autostart beim Booten
```

Die Website läuft jetzt lokal auf dem Server unter Port `3000`. Nützliche Befehle:

```bash
pm2 status              # laufende Prozesse anzeigen
pm2 logs baltic-freight # Logs live ansehen
pm2 restart baltic-freight
```

## 7. Domain auf den Server zeigen lassen

Im Strato-Kundenpanel unter **Domains → DNS-Einstellungen** der gewünschten Domain einen **A-Record** anlegen, der
auf die Server-IP zeigt (für `www` entsprechend einen zweiten A-Record oder einen CNAME auf die Hauptdomain).
DNS-Änderungen können bis zu 24 Stunden brauchen, meist geht es aber innerhalb weniger Minuten bis Stunden.

## 8. Reverse Proxy + kostenloses SSL-Zertifikat (nginx + Let's Encrypt)

Node.js soll nicht direkt öffentlich auf Port 3000 erreichbar sein. Stattdessen übernimmt **nginx** Port 80/443
und leitet intern an Node weiter – das ermöglicht außerdem ein kostenloses HTTPS-Zertifikat.

```bash
apt install -y nginx certbot python3-certbot-nginx
```

Nginx-Konfiguration anlegen (`/etc/nginx/sites-available/baltic-freight`):

```nginx
server {
    listen 80;
    server_name deine-domain.de www.deine-domain.de;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Aktivieren und SSL-Zertifikat holen (certbot passt die Konfiguration automatisch für HTTPS an):

```bash
ln -s /etc/nginx/sites-available/baltic-freight /etc/nginx/sites-enabled/
nginx -t && systemctl reload nginx
certbot --nginx -d deine-domain.de -d www.deine-domain.de
```

Certbot verlängert das Zertifikat danach automatisch (Cronjob/Timer wird mit installiert).

## 9. Firewall

Nur die wirklich benötigten Ports öffentlich lassen:

```bash
ufw allow 22    # SSH
ufw allow 80    # HTTP
ufw allow 443   # HTTPS
ufw enable
```

Port 3000 (Node.js) bleibt intern – nginx spricht ihn über `localhost` an, von außen ist er nicht erreichbar.

## 10. Zukünftige Updates einspielen

```bash
cd spedition-webseite
git pull
npm install
npm run build
pm2 restart baltic-freight
```

## 11. Wichtig zu wissen

- **Inhaltsdaten (`.data/db.json`)**: News, Stellenangebote, Fuhrpark-Kategorien, Team, Rezensionen, Partner und
  Unternehmensdaten liegen in einer einzelnen JSON-Datei auf dem Server (siehe README). Sie wird beim ersten
  Start automatisch angelegt. **Regelmäßig sichern** (z. B. `scp root@server:.../.data/db.json ./backup/`) –
  geht dieser Ordner verloren, sind alle über die Website-Verwaltung gepflegten Inhalte weg (der Code/die
  Struktur der Website ist davon nicht betroffen, nur die Inhalte).
- **Kein serverseitiger Zugriffsschutz auf API-Routen**: Die `/api/*`-Routen prüfen aktuell keine Berechtigung
  (nur der Mitarbeiterbereich selbst ist per Discord-Login geschützt, das Frontend). Für die aktuelle Nutzung
  ausreichend, aber kein produktionsreifer Sicherheitsstandard für sensible Daten.
- **Discord-Login statt Passwort**: Wer sich einloggen darf, verwaltest du nicht mehr im Code, sondern in der
  Website-Verwaltung unter „Mitarbeiter-Konten" (dort trägst du je Mitarbeiter die Discord-Nutzer-ID ein). Die
  Umgebungsvariablen aus Schritt 4 (`DISCORD_CLIENT_ID`, `DISCORD_CLIENT_SECRET`, `DISCORD_REDIRECT_URI`,
  `SESSION_SECRET`, `OWNER_DISCORD_ID`) müssen in `.env.local` auf dem Server gesetzt sein, **bevor** `pm2 start`
  bzw. `pm2 restart` läuft, sonst bleibt der Mitarbeiterbereich für alle unzugänglich. Nach einer Änderung an
  `.env.local` reicht `pm2 restart baltic-freight` (kein erneuter Build nötig).
