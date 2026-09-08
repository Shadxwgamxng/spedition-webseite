# Hosting auf Living-Bots.net – Schritt-für-Schritt-Anleitung

Ja, das geht — aber wie bei Strato **nicht** über das klassische Living-Bots-Produkt „Webspace / Homepage
mieten" (das ist reines PHP-/MySQL-Shared-Hosting für z. B. WordPress, ohne Node.js). Diese Website ist eine
Next.js-Anwendung mit eigenem Server (API-Routen, serverseitig gerenderte Seiten) — dafür braucht es Root-Zugriff
mit Node.js, also einen **vServer** oder **Rootserver** von Living-Bots:

- **vServer mieten** (living-bots.net/vserver-mieten) — güns­tigster Einstieg, ab ca. 10 €/Monat (Silver-Tarif:
  6 GB RAM, 100 GB NVMe SSD) — für diese Website völlig ausreichend.
- **Rootserver mieten** (living-bots.net/jetzt-rootserver-mieten) — mehr Leistung/dedizierte Hardware, falls
  später mehr Traffic erwartet wird.

Beide laufen auf AMD-EPYC-Hardware im Rechenzentrum Frankfurt/Main, mit Root-Zugriff per SSH, DDoS-Schutz
(bereits inklusive — kein zusätzlicher Schritt nötig) und Bezahlung auf Prepaid-Basis (keine Mindestlaufzeit).

Empfehlung: **Debian 12** oder **Ubuntu 22.04**, mindestens 2 GB RAM — der Silver-vServer (6 GB) ist bequem
genug.

---

## 1. Server bestellen & per SSH verbinden

1. Auf living-bots.net den **vServer** bestellen, dabei als Betriebssystem **Debian 12** oder **Ubuntu 22.04**
   auswählen.
2. Nach der Bezahlung (Prepaid) wird der Server automatisiert eingerichtet; Zugangsdaten (Server-IP, root-Passwort
   oder SSH-Key) findest du im **Webinterface** von Living-Bots (dort auch: Neustart, Neuinstallation,
   VNC-Konsole falls SSH mal nicht geht, Backups).
3. Verbinden:
   ```bash
   ssh root@DEINE-SERVER-IP
   ```

## 2. Node.js installieren

Über `nvm` (Node Version Manager), damit die Node-Version unabhängig vom System aktuell gehalten werden kann:

```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh | bash
source ~/.bashrc
nvm install 22
nvm use 22
node -v   # sollte v22.x zeigen
```

(Next.js 16 benötigt mindestens Node 20.9 – Node 22 LTS ist eine sichere Wahl.)

## 3. Projekt auf den Server bringen

Am saubersten per Git (spätere Updates sind dann nur ein `git pull`):

```bash
apt update && apt install -y git
git clone https://github.com/<dein-github-name>/spedition-webseite.git
cd spedition-webseite
```

Alternativ per SFTP/`scp` das gesamte Projektverzeichnis hochladen (ohne `node_modules` und `.next` – die werden
auf dem Server neu gebaut).

## 4. Installieren & bauen

```bash
npm install
npm run build
```

## 5. Dauerhaft laufen lassen mit PM2

Ohne Prozess-Manager stirbt der Server, sobald die SSH-Sitzung endet. **PM2** startet ihn automatisch neu (auch
nach einem Server-Reboot):

```bash
npm install -g pm2
pm2 start npm --name baltic-freight -- start
pm2 save
pm2 startup   # gibt einen Befehl aus, den du einmal kopierst & ausführst – aktiviert Autostart beim Booten
```

Die Website läuft jetzt lokal auf dem Server unter Port `3000`. Nützliche Befehle:

```bash
pm2 status
pm2 logs baltic-freight
pm2 restart baltic-freight
```

## 6. Domain auf den Server zeigen lassen

Falls die Domain nicht bei Living-Bots selbst registriert ist (Living-Bots bietet zwar auch Domains an, ein
bestehender Domain-Anbieter funktioniert aber genauso): Beim jeweiligen Domain-Provider unter den
**DNS-Einstellungen** einen **A-Record** anlegen, der auf die Server-IP des vServers zeigt (für `www`
entsprechend einen zweiten A-Record oder einen CNAME auf die Hauptdomain). DNS-Änderungen können bis zu 24
Stunden brauchen, meist geht es aber innerhalb weniger Minuten bis Stunden.

## 7. Reverse Proxy + kostenloses SSL-Zertifikat (nginx + Let's Encrypt)

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

## 8. Firewall

Nur die wirklich benötigten Ports öffentlich lassen (Living-Bots' DDoS-Schutz greift davor auf Netzwerkebene,
diese lokale Firewall ist zusätzlich sinnvoll):

```bash
ufw allow 22    # SSH
ufw allow 80    # HTTP
ufw allow 443   # HTTPS
ufw enable
```

Port 3000 (Node.js) bleibt intern – nginx spricht ihn über `localhost` an, von außen ist er nicht erreichbar.

## 9. Zukünftige Updates einspielen

```bash
cd spedition-webseite
git pull
npm install
npm run build
pm2 restart baltic-freight
```

## 10. Wichtig zu wissen

- **Inhaltsdaten (`.data/db.json`)**: News, Stellenangebote, Fuhrpark-Kategorien, Team, Rezensionen, Partner und
  Unternehmensdaten liegen in einer einzelnen JSON-Datei auf dem Server (siehe README). Sie wird beim ersten
  Start automatisch angelegt. **Regelmäßig sichern** (z. B. `scp root@server:.../.data/db.json ./backup/`) –
  zusätzlich bietet das Living-Bots-Webinterface eigene Server-Backups an, die sich dafür einrichten lassen.
  Geht die Datei verloren, sind alle über die Website-Verwaltung gepflegten Inhalte weg (der Code/die Struktur
  der Website ist davon nicht betroffen, nur die Inhalte).
- **Kein serverseitiger Zugriffsschutz auf API-Routen**: Die `/api/*`-Routen prüfen aktuell keine Berechtigung
  (nur der Mitarbeiterbereich selbst ist per Login geschützt, das Frontend). Für die aktuelle Nutzung ausreichend,
  aber kein produktionsreifer Sicherheitsstandard für sensible Daten.
- **Mitarbeiter-Login-Zugangsdaten** änderst du in `src/lib/auth.tsx` (`ADMIN_USERNAME` / `ADMIN_PASSWORD`) – nach
  einer Änderung musst du erneut bauen und deployen (Schritt 9).
- **Prepaid-Guthaben im Blick behalten**: Läuft das Guthaben bei Living-Bots ab, wird der Server pausiert/gelöscht
  – rechtzeitig aufladen bzw. automatische Verlängerung im Kundenkonto aktivieren, sonst geht die Website offline.
