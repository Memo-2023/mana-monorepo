# PostgreSQL Backup

> Stündliche Dumps + tägliche Base-Backups für alle Mana-Datenbanken

## Übersicht

| Aspekt | Vorher | Jetzt |
|--------|--------|-------|
| **Frequenz** | 1x täglich (03:00) | Stündlich + täglich |
| **Max. Datenverlust** | 24 Stunden | 1 Stunde |
| **Backup-Typ** | Nur pg_dumpall | pg_dumpall (stündlich) + pg_basebackup (täglich) |
| **Kompression** | Keine | gzip |
| **Retention** | 30 Tage | 48h Dumps + 30 Tage Base-Backups |
| **Automatisch** | LaunchAgent Cron | Docker Container (always running) |

## Architektur

```
PostgreSQL (mana-infra-postgres)
    │
    └── postgres-backup Container (mana-infra-postgres-backup)
        ├── Jede Stunde → pg_dumpall | gzip  (alle DBs als SQL)
        └── Täglich 03:00 → pg_basebackup -Ft -z  (physisches Backup)
```

## Backup-Speicherort

```
/Volumes/ManaData/backups/postgres/
├── hourly_20260324_140000.sql.gz    # SQL Dump (stündlich)
├── hourly_20260324_150000.sql.gz
├── ...
├── base_20260324_030000/            # Base Backup (täglich)
│   ├── base.tar.gz
│   └── pg_wal.tar.gz
└── base_20260323_030000/
```

**Retention:**
- Stündliche Dumps: 48 Stück (~2 Tage)
- Tägliche Base-Backups: 30 Stück (~1 Monat)

## Container-Status prüfen

```bash
# Container Status
docker ps --filter name=mana-infra-postgres-backup

# Logs (letzte Backups)
docker logs mana-infra-postgres-backup --tail 20

# Backup-Größe
du -sh /Volumes/ManaData/backups/postgres/
ls -lah /Volumes/ManaData/backups/postgres/hourly_*.sql.gz | tail -5
```

## Wiederherstellung

### Szenario 1: Aus stündlichem Dump (SQL)

```bash
# 1. Gewünschten Dump finden
ls -la /Volumes/ManaData/backups/postgres/hourly_*.sql.gz

# 2. Alle Datenbanken wiederherstellen
gunzip -c /Volumes/ManaData/backups/postgres/hourly_20260324_140000.sql.gz \
  | docker exec -i mana-infra-postgres psql -U postgres

# 3. Oder einzelne Datenbank:
gunzip -c /Volumes/ManaData/backups/postgres/hourly_20260324_140000.sql.gz \
  | grep -A 99999 'connect chat_db' | grep -B 99999 'connect ' \
  | docker exec -i mana-infra-postgres psql -U postgres -d chat_db
```

### Szenario 2: Aus Base-Backup (physisch)

```bash
# 1. PostgreSQL stoppen
docker compose -f docker-compose.macmini.yml stop postgres

# 2. Altes Datenverzeichnis sichern
sudo mv /Volumes/ManaData/postgres /Volumes/ManaData/postgres.broken

# 3. Neues Verzeichnis aus Backup erstellen
sudo mkdir -p /Volumes/ManaData/postgres
cd /Volumes/ManaData/postgres
sudo tar xzf /Volumes/ManaData/backups/postgres/base_20260324_030000/base.tar.gz
sudo tar xzf /Volumes/ManaData/backups/postgres/base_20260324_030000/pg_wal.tar.gz -C pg_wal/
sudo chown -R 70:70 /Volumes/ManaData/postgres

# 4. PostgreSQL starten
docker compose -f docker-compose.macmini.yml start postgres

# 5. Prüfen
docker exec mana-infra-postgres psql -U postgres -c "\l"
```

### Szenario 3: Einzelne Datenbank aus Dump

```bash
# Chat-DB wiederherstellen (Drop + Recreate)
docker exec mana-infra-postgres psql -U postgres -c "DROP DATABASE IF EXISTS chat_db;"
docker exec mana-infra-postgres psql -U postgres -c "CREATE DATABASE chat_db;"

gunzip -c /Volumes/ManaData/backups/postgres/hourly_20260324_140000.sql.gz \
  | docker exec -i mana-infra-postgres psql -U postgres -d chat_db
```

## Manuelles Backup

```bash
# Sofortiger Dump
docker exec mana-infra-postgres pg_dumpall -U postgres | gzip > /Volumes/ManaData/backups/postgres/manual_$(date +%Y%m%d_%H%M%S).sql.gz

# Sofortiges Base-Backup
mkdir -p /Volumes/ManaData/backups/postgres/manual_base_$(date +%Y%m%d)
docker exec mana-infra-postgres pg_basebackup -U postgres -D /tmp/backup -Ft -z -P
docker cp mana-infra-postgres:/tmp/backup /Volumes/ManaData/backups/postgres/manual_base_$(date +%Y%m%d)
```

## Erste Einrichtung

```bash
# Backup-Verzeichnis erstellen
sudo mkdir -p /Volumes/ManaData/backups/postgres

# Container starten
docker compose -f docker-compose.macmini.yml up -d postgres-backup

# Prüfen ob Backup läuft
docker logs mana-infra-postgres-backup --tail 5
```
