# PocketBase direkt auf Server installieren

## Warum?

- Daten bleiben erhalten
- Einfacher SSH-Zugang zum Admin Panel
- Keine Docker-Komplexität
- Bessere Performance

## Installation auf Server (einmalig)

SSH auf Server:

```bash
ssh root@91.99.221.179
```

### 1. PocketBase installieren

```bash
# Verzeichnis erstellen
mkdir -p /opt/pocketbase
cd /opt/pocketbase

# PocketBase herunterladen
wget https://github.com/pocketbase/pocketbase/releases/download/v0.26.2/pocketbase_0.26.2_linux_amd64.zip
unzip pocketbase_0.26.2_linux_amd64.zip
rm pocketbase_0.26.2_linux_amd64.zip
chmod +x pocketbase

# Daten-Verzeichnis
mkdir -p /opt/pocketbase/pb_data
```

### 2. Systemd Service erstellen

```bash
cat > /etc/systemd/system/pocketbase.service << 'EOF'
[Unit]
Description=PocketBase
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=/opt/pocketbase
ExecStart=/opt/pocketbase/pocketbase serve --http=127.0.0.1:8090 --dir=/opt/pocketbase/pb_data
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF
```

### 3. Service starten

```bash
systemctl daemon-reload
systemctl enable pocketbase
systemctl start pocketbase
systemctl status pocketbase
```

### 4. Admin erstellen

```bash
cd /opt/pocketbase
./pocketbase superuser create --dir=/opt/pocketbase/pb_data
```

## App-Konfiguration anpassen

### In `.env.production`:

```env
PUBLIC_POCKETBASE_URL=https://ulo.ad/api
POCKETBASE_URL=http://127.0.0.1:8090
```

### In Dockerfile - PocketBase ENTFERNEN:

```dockerfile
# DIESE ZEILEN ENTFERNEN:
# RUN wget https://github.com/pocketbase/pocketbase/...
# ENTFERNEN: supervisor config für pocketbase
```

### Nginx Configuration:

```nginx
location /api/ {
    proxy_pass http://127.0.0.1:8090/;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_cache_bypass $http_upgrade;
}
```

## Vorteile:

✅ Daten bleiben IMMER erhalten
✅ Einfacher SSH-Zugang: `ssh -L 8090:localhost:8090 root@server`
✅ Backups einfacher: `/opt/pocketbase/pb_data`
✅ Unabhängig von Docker-Deployments
✅ Direkter Zugriff für Wartung

## Backup (wichtig!)

```bash
# Backup erstellen
cd /opt/pocketbase
./pocketbase backup --dir=/opt/pocketbase/pb_data

# Oder ganzes Verzeichnis
tar -czf pocketbase-backup-$(date +%Y%m%d).tar.gz /opt/pocketbase/pb_data
```
