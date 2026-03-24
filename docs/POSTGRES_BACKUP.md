# PostgreSQL Backup mit pgBackRest

> Point-in-Time Recovery (PITR) für alle Mana-Datenbanken

## Übersicht

| Aspekt | Vorher (pg_dumpall) | Jetzt (pgBackRest) |
|--------|--------------------|--------------------|
| **Recovery Point** | Letzter Dump (24h Verlust möglich) | Bis auf die letzte Sekunde |
| **Backup-Typ** | Nur Full Dump | Full + Differential + Incremental |
| **Kompression** | Keine | Zstandard (zst) |
| **Parallelisierung** | Nein | Ja (2 Threads) |
| **Validierung** | Keine | Automatisch |

## Architektur

```
PostgreSQL (mana-infra-postgres)
    │
    ├── WAL-Archivierung → pgBackRest empfängt WAL-Segmente
    │
    └── Scheduled Backups:
        ├── 03:00 → Full Backup (alle Daten)
        ├── 09:00, 15:00, 21:00 → Differential (nur Änderungen seit Full)
        └── Jede Stunde → Incremental (nur Änderungen seit letztem Backup)
```

## Backup-Speicherort

```
/Volumes/ManaData/backups/pgbackrest/
├── archive/          # WAL-Archive (kontinuierlich)
└── backup/           # Full + Diff + Incr Backups
```

**Retention:** 4 Full Backups + 14 Differentials (~4 Wochen Rückblick)

## Befehle

### Status prüfen

```bash
# Backup-Info anzeigen
docker exec mana-infra-pgbackrest pgbackrest --stanza=mana info

# Letzte Backups auflisten
docker exec mana-infra-pgbackrest pgbackrest --stanza=mana info --output=json | jq '.[] | .backup[] | {label, type, timestamp_start, database_size}'
```

### Manuelles Backup

```bash
# Full Backup (manuell)
docker exec mana-infra-pgbackrest pgbackrest --stanza=mana --type=full backup

# Differential Backup
docker exec mana-infra-pgbackrest pgbackrest --stanza=mana --type=diff backup

# Incremental Backup
docker exec mana-infra-pgbackrest pgbackrest --stanza=mana --type=incr backup
```

### Backup validieren

```bash
# Verify prüft Integrität aller Backups
docker exec mana-infra-pgbackrest pgbackrest --stanza=mana verify
```

## Wiederherstellung (Restore)

### Szenario 1: Komplette Wiederherstellung (letzter Stand)

```bash
# 1. PostgreSQL stoppen
docker compose -f docker-compose.macmini.yml stop postgres

# 2. Altes Datenverzeichnis sichern
sudo mv /Volumes/ManaData/postgres /Volumes/ManaData/postgres.broken

# 3. Neues Verzeichnis erstellen
sudo mkdir -p /Volumes/ManaData/postgres
sudo chown 70:70 /Volumes/ManaData/postgres

# 4. Restore ausführen
docker exec mana-infra-pgbackrest pgbackrest --stanza=mana restore

# 5. PostgreSQL starten
docker compose -f docker-compose.macmini.yml start postgres

# 6. Prüfen
docker exec mana-infra-postgres psql -U postgres -c "\l"
```

### Szenario 2: Point-in-Time Recovery (z.B. auf 14:59 Uhr)

```bash
# 1. PostgreSQL stoppen
docker compose -f docker-compose.macmini.yml stop postgres

# 2. Altes Datenverzeichnis sichern
sudo mv /Volumes/ManaData/postgres /Volumes/ManaData/postgres.broken

# 3. Neues Verzeichnis erstellen
sudo mkdir -p /Volumes/ManaData/postgres
sudo chown 70:70 /Volumes/ManaData/postgres

# 4. PITR Restore auf bestimmten Zeitpunkt
docker exec mana-infra-pgbackrest pgbackrest --stanza=mana \
  --type=time \
  --target="2026-03-24 14:59:00+01" \
  restore

# 5. PostgreSQL starten
docker compose -f docker-compose.macmini.yml start postgres
```

### Szenario 3: Einzelne Datenbank wiederherstellen

pgBackRest stellt immer den gesamten PostgreSQL-Cluster wieder her. Für einzelne Datenbanken:

```bash
# 1. Restore in temporäres Verzeichnis
docker exec mana-infra-pgbackrest pgbackrest --stanza=mana \
  --pg1-path=/tmp/pg-restore \
  restore

# 2. Temporären PostgreSQL starten und pg_dump auf einzelne DB
docker run --rm -v /tmp/pg-restore:/var/lib/postgresql/data \
  postgres:16-alpine pg_dump -U postgres chat_db > /tmp/chat_db.sql

# 3. In laufende DB importieren
cat /tmp/chat_db.sql | docker exec -i mana-infra-postgres psql -U postgres chat_db
```

## Monitoring

### In Grafana (geplant)

pgBackRest exportiert keine nativen Prometheus-Metriken. Monitoring via:

```bash
# Health-Check in health-check.sh hinzufügen:
LAST_BACKUP=$(docker exec mana-infra-pgbackrest pgbackrest --stanza=mana info --output=json 2>/dev/null | jq -r '.[0].backup[-1].timestamp_stop // "never"')
echo "Last backup: $LAST_BACKUP"
```

### Alerting

Der Health-Check (`scripts/mac-mini/health-check.sh`) kann prüfen ob das letzte Backup älter als 24h ist und einen Telegram-Alert senden.

## Erste Einrichtung

Beim ersten Start auf dem Server:

```bash
# 1. Backup-Verzeichnis erstellen
sudo mkdir -p /Volumes/ManaData/backups/pgbackrest
sudo chown 999:999 /Volumes/ManaData/backups/pgbackrest

# 2. Container starten
docker compose -f docker-compose.macmini.yml up -d postgres postgres-backup

# 3. Stanza erstellen (einmalig)
docker exec mana-infra-pgbackrest pgbackrest --stanza=mana stanza-create

# 4. Erstes Full Backup
docker exec mana-infra-pgbackrest pgbackrest --stanza=mana --type=full backup

# 5. Prüfen
docker exec mana-infra-pgbackrest pgbackrest --stanza=mana info
```

## Konfigurationsdateien

| Datei | Zweck |
|-------|-------|
| `docker/postgres/postgresql.conf` | WAL-Archivierung + Performance-Tuning |
| `docker/postgres/pgbackrest.conf` | pgBackRest Stanza + Retention |
| `docker-compose.macmini.yml` | Container-Definition (postgres-backup) |
