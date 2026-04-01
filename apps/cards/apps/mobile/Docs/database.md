# Cards Datenbank-Dokumentation

## Übersicht

Die Cards-Anwendung verwendet **Supabase** (PostgreSQL) als Backend-Datenbank. Die Datenbank ist für eine mobile Lern- und Karteikarten-Anwendung konzipiert und unterstützt Multi-User-Funktionalität mit Row Level Security (RLS).

## Datenbankstruktur

### Tabellen

#### 1. **profiles**

Speichert Benutzerprofile und Einstellungen.

| Spalte         | Typ         | Beschreibung                         | Constraints           |
| -------------- | ----------- | ------------------------------------ | --------------------- |
| `id`           | uuid        | Benutzer-ID (Referenz zu auth.users) | PRIMARY KEY, NOT NULL |
| `username`     | varchar     | Eindeutiger Benutzername             | NOT NULL, UNIQUE      |
| `display_name` | varchar     | Anzeigename des Benutzers            | NULL                  |
| `avatar_url`   | text        | URL zum Profilbild                   | NULL                  |
| `bio`          | text        | Biografie/Beschreibung               | NULL                  |
| `preferences`  | jsonb       | Benutzereinstellungen als JSON       | DEFAULT '{}'          |
| `created_at`   | timestamptz | Erstellungszeitpunkt                 | DEFAULT now()         |
| `updated_at`   | timestamptz | Letzte Aktualisierung                | DEFAULT now()         |

**Beziehungen:**

- Foreign Key zu `auth.users(id)` über `id`

#### 2. **decks**

Verwaltet Kartenstapel/Sammlungen von Lernkarten.

| Spalte            | Typ         | Beschreibung                   | Constraints                            |
| ----------------- | ----------- | ------------------------------ | -------------------------------------- |
| `id`              | uuid        | Eindeutige Deck-ID             | PRIMARY KEY, DEFAULT gen_random_uuid() |
| `user_id`         | uuid        | Besitzer des Decks             | NOT NULL, FK zu auth.users             |
| `title`           | varchar     | Titel des Decks                | NOT NULL                               |
| `description`     | text        | Beschreibung des Decks         | NULL                                   |
| `cover_image_url` | text        | URL zum Cover-Bild             | NULL                                   |
| `is_public`       | boolean     | Öffentlich sichtbar?           | DEFAULT false                          |
| `settings`        | jsonb       | Deck-spezifische Einstellungen | DEFAULT '{}'                           |
| `tags`            | text[]      | Array von Tags                 | DEFAULT '{}'                           |
| `metadata`        | jsonb       | Zusätzliche Metadaten          | DEFAULT '{}'                           |
| `created_at`      | timestamptz | Erstellungszeitpunkt           | DEFAULT now()                          |
| `updated_at`      | timestamptz | Letzte Aktualisierung          | DEFAULT now()                          |

**Beziehungen:**

- Foreign Key zu `auth.users(id)` über `user_id`
- One-to-Many Beziehung zu `cards`

#### 3. **cards**

Einzelne Lernkarten innerhalb der Decks.

| Spalte        | Typ              | Beschreibung                 | Constraints                            |
| ------------- | ---------------- | ---------------------------- | -------------------------------------- |
| `id`          | uuid             | Eindeutige Karten-ID         | PRIMARY KEY, DEFAULT gen_random_uuid() |
| `deck_id`     | uuid             | Zugehöriges Deck             | NOT NULL, FK zu decks                  |
| `position`    | integer          | Position innerhalb des Decks | NOT NULL                               |
| `title`       | varchar          | Titel/Überschrift der Karte  | NULL                                   |
| `content`     | jsonb            | Karteninhalt (strukturiert)  | DEFAULT '{}'                           |
| `card_type`   | card_type (enum) | Typ der Karte                | NOT NULL, DEFAULT 'text'               |
| `ai_model`    | varchar          | Verwendetes AI-Modell        | NULL                                   |
| `ai_prompt`   | text             | AI-Prompt für Generierung    | NULL                                   |
| `version`     | integer          | Versionsnummer               | DEFAULT 1                              |
| `is_favorite` | boolean          | Als Favorit markiert?        | DEFAULT false                          |
| `created_at`  | timestamptz      | Erstellungszeitpunkt         | DEFAULT now()                          |
| `updated_at`  | timestamptz      | Letzte Aktualisierung        | DEFAULT now()                          |

**Beziehungen:**

- Foreign Key zu `decks(id)` über `deck_id`

### Custom Types

#### card_type (Enum)

Definiert die verschiedenen Kartentypen:

- `text` - Reine Textkarte
- `mixed` - Gemischter Inhalt
- `quiz` - Quiz-Karte
- `flashcard` - Klassische Lernkarte

## Sicherheit (Row Level Security)

Alle Tabellen haben RLS aktiviert mit folgenden Policies:

### profiles Policies

| Policy                              | Operation | Beschreibung                                            |
| ----------------------------------- | --------- | ------------------------------------------------------- |
| "Profiles are viewable by everyone" | SELECT    | Alle können Profile einsehen                            |
| "Users can insert own profile"      | INSERT    | Authentifizierte Benutzer können eigenes Profil anlegen |
| "Users can update own profile"      | UPDATE    | Benutzer können nur eigenes Profil bearbeiten           |

### decks Policies

| Policy                            | Operation | Beschreibung                                     |
| --------------------------------- | --------- | ------------------------------------------------ |
| "View public decks and own decks" | SELECT    | Öffentliche Decks und eigene Decks sind sichtbar |
| "Users can create own decks"      | INSERT    | Authentifizierte Benutzer können Decks erstellen |
| "Users can update own decks"      | UPDATE    | Nur eigene Decks können bearbeitet werden        |
| "Users can delete own decks"      | DELETE    | Nur eigene Decks können gelöscht werden          |

### cards Policies

| Policy                                | Operation | Beschreibung                                             |
| ------------------------------------- | --------- | -------------------------------------------------------- |
| "View cards from accessible decks"    | SELECT    | Karten aus öffentlichen oder eigenen Decks sind sichtbar |
| "Users can create cards in own decks" | INSERT    | Karten können nur in eigenen Decks erstellt werden       |
| "Users can update cards in own decks" | UPDATE    | Karten in eigenen Decks können bearbeitet werden         |
| "Users can delete cards in own decks" | DELETE    | Karten in eigenen Decks können gelöscht werden           |

## Aktivierte Extensions

- **uuid-ossp** (v1.1) - UUID-Generierung
- **pgcrypto** (v1.3) - Kryptografische Funktionen
- **pg_graphql** (v1.5.11) - GraphQL-Unterstützung
- **pg_stat_statements** (v1.11) - Query-Performance-Monitoring
- **supabase_vault** (v0.3.1) - Sichere Speicherung sensibler Daten

## Migrations-Historie

Die Datenbank wurde über folgende Migrationen aufgebaut:

1. `20250819065657_create_profiles_table` - Erstellung der Profil-Tabelle
2. `20250819065714_create_decks_table` - Erstellung der Decks-Tabelle
3. `20250819065733_create_cards_table` - Erstellung der Cards-Tabelle
4. `20250819065806_enable_rls_and_policies` - Aktivierung von RLS und initiale Policies
5. `20250819081009_fix_profiles_insert_policy` - Korrektur der Profil-Insert-Policy
6. `20250819081105_update_all_rls_policies` - Aktualisierung aller RLS-Policies
7. `20250819091919_fix_decks_rls_policy` - Korrektur der Decks-RLS-Policy
8. `20250819092831_fix_decks_foreign_key` - Korrektur des Foreign Keys in Decks
9. `20250819100624_fix_cards_rls_policies` - Korrektur der Cards-RLS-Policies

## Datenmodell-Beziehungen

```
auth.users
    ↓ (1:1)
profiles
    ↓ (1:n)
decks
    ↓ (1:n)
cards
```

## Verwendung in der Anwendung

### Supabase Client-Konfiguration

Die Anwendung verwendet den Supabase JavaScript Client (`utils/supabase.ts`) mit:

- **AsyncStorage** für Session-Persistenz
- Umgebungsvariablen für Konfiguration:
  - `EXPO_PUBLIC_SUPABASE_URL`
  - `EXPO_PUBLIC_SUPABASE_ANON_KEY`

### Typische Operationen

1. **Benutzerregistrierung**: Erstellt automatisch einen Eintrag in `profiles`
2. **Deck-Erstellung**: Benutzer können mehrere Decks mit verschiedenen Einstellungen erstellen
3. **Karten-Management**: Karten können verschiedene Typen haben und AI-generiert sein
4. **Öffentliche Decks**: Decks können als öffentlich markiert und von anderen eingesehen werden

## Best Practices

1. **Immer RLS verwenden**: Alle Datenzugriffe werden durch RLS-Policies geschützt
2. **JSONB für Flexibilität**: `content`, `settings`, `preferences` und `metadata` nutzen JSONB für flexible Datenstrukturen
3. **UUID als Primary Keys**: Verwendung von UUIDs für bessere Skalierbarkeit und Sicherheit
4. **Timestamps**: Automatisches Tracking von Erstellung und Aktualisierung
5. **Soft Deletes**: Können über das `metadata` JSONB-Feld implementiert werden

## Optimierungsmöglichkeiten

1. **Indizes**: Zusätzliche Indizes auf häufig genutzte Spalten (z.B. `user_id`, `is_public`)
2. **Partitionierung**: Bei großen Datenmengen könnte Tabellen-Partitionierung sinnvoll sein
3. **Materialized Views**: Für komplexe Abfragen öffentlicher Decks
4. **Full-Text Search**: Implementierung mit PostgreSQL FTS für Deck- und Kartensuche
5. **Caching**: Redis-Integration für häufig abgerufene öffentliche Inhalte
