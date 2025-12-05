# Voxel-Lava Datenbank-Dokumentation

Diese Dokumentation beschreibt den Aufbau und die Funktionsweise der Supabase-Datenbank für das Voxel-Lava-Spiel. Die Datenbank ermöglicht das Speichern, Teilen und Bewerten von Levels.

## Datenbankschema

### Tabellen

#### 1. `levels`

Speichert alle Level-Daten inklusive der Voxel-Informationen.

| Spalte          | Typ       | Beschreibung                                                  |
| --------------- | --------- | ------------------------------------------------------------- |
| `id`            | UUID      | Primärschlüssel, automatisch generiert                        |
| `name`          | TEXT      | Name des Levels                                               |
| `description`   | TEXT      | Optionale Beschreibung des Levels                             |
| `user_id`       | UUID      | Fremdschlüssel zur `auth.users`-Tabelle, Ersteller des Levels |
| `voxel_data`    | JSONB     | Speichert alle Blöcke mit Position und Typ als JSON           |
| `spawn_point`   | JSONB     | Position des Spawn-Punkts als JSON `{x, y, z}`                |
| `world_size`    | JSONB     | Größe der Welt als JSON `{width, height, depth}`              |
| `is_public`     | BOOLEAN   | Gibt an, ob das Level öffentlich ist (Standard: false)        |
| `created_at`    | TIMESTAMP | Zeitpunkt der Erstellung                                      |
| `updated_at`    | TIMESTAMP | Zeitpunkt der letzten Aktualisierung                          |
| `play_count`    | INTEGER   | Anzahl der Aufrufe des Levels                                 |
| `likes_count`   | INTEGER   | Anzahl der Likes des Levels                                   |
| `difficulty`    | TEXT      | Optionaler Schwierigkeitsgrad des Levels                      |
| `tags`          | TEXT[]    | Array von Tags zur Kategorisierung                            |
| `thumbnail_url` | TEXT      | Optionale URL zum Vorschaubild                                |

#### 2. `level_likes`

Speichert die Likes für Levels.

| Spalte       | Typ       | Beschreibung                            |
| ------------ | --------- | --------------------------------------- |
| `id`         | UUID      | Primärschlüssel, automatisch generiert  |
| `level_id`   | UUID      | Fremdschlüssel zur `levels`-Tabelle     |
| `user_id`    | UUID      | Fremdschlüssel zur `auth.users`-Tabelle |
| `created_at` | TIMESTAMP | Zeitpunkt des Likes                     |

Constraints:

- Unique-Constraint auf `(level_id, user_id)`, um doppelte Likes zu verhindern

#### 3. `level_plays`

Speichert Spielstatistiken für Levels.

| Spalte            | Typ       | Beschreibung                                      |
| ----------------- | --------- | ------------------------------------------------- |
| `id`              | UUID      | Primärschlüssel, automatisch generiert            |
| `level_id`        | UUID      | Fremdschlüssel zur `levels`-Tabelle               |
| `user_id`         | UUID      | Fremdschlüssel zur `auth.users`-Tabelle           |
| `completion_time` | FLOAT     | Zeit in Sekunden (null, wenn nicht abgeschlossen) |
| `attempts`        | INTEGER   | Anzahl der Versuche (Standard: 1)                 |
| `completed`       | BOOLEAN   | Gibt an, ob das Level abgeschlossen wurde         |
| `created_at`      | TIMESTAMP | Zeitpunkt des Spielversuchs                       |

### Indizes

Zur Optimierung der Abfrageleistung wurden folgende Indizes erstellt:

```sql
CREATE INDEX idx_levels_user_id ON levels(user_id);
CREATE INDEX idx_levels_is_public ON levels(is_public);
CREATE INDEX idx_level_likes_level_id ON level_likes(level_id);
CREATE INDEX idx_level_likes_user_id ON level_likes(user_id);
CREATE INDEX idx_level_plays_level_id ON level_plays(level_id);
CREATE INDEX idx_level_plays_user_id ON level_plays(user_id);
```

### Funktionen und Trigger

#### 1. `update_updated_at_column()`

Aktualisiert automatisch den `updated_at`-Zeitstempel bei Änderungen an einem Level.

```sql
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_levels_updated_at
BEFORE UPDATE ON levels
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();
```

#### 2. `update_likes_count()`

Aktualisiert automatisch den `likes_count` in der `levels`-Tabelle, wenn ein Like hinzugefügt oder entfernt wird.

```sql
CREATE OR REPLACE FUNCTION update_likes_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE levels SET likes_count = likes_count + 1 WHERE id = NEW.level_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE levels SET likes_count = likes_count - 1 WHERE id = OLD.level_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_level_likes_count
AFTER INSERT OR DELETE ON level_likes
FOR EACH ROW
EXECUTE FUNCTION update_likes_count();
```

#### 3. `update_play_count()`

Aktualisiert automatisch den `play_count` in der `levels`-Tabelle, wenn ein Spielversuch hinzugefügt wird.

```sql
CREATE OR REPLACE FUNCTION update_play_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE levels SET play_count = play_count + 1 WHERE id = NEW.level_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_level_play_count
AFTER INSERT ON level_plays
FOR EACH ROW
EXECUTE FUNCTION update_play_count();
```

#### 4. `increment_play_count(level_id UUID)`

Erhöht den `play_count` für ein Level, auch wenn kein Benutzer angemeldet ist.

```sql
CREATE OR REPLACE FUNCTION increment_play_count(level_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE levels SET play_count = play_count + 1 WHERE id = level_id;
END;
$$ LANGUAGE plpgsql;
```

## Sicherheitsrichtlinien (RLS)

Die Datenbank verwendet Row Level Security (RLS), um den Zugriff auf Daten zu kontrollieren:

### 1. Levels

```sql
-- Levels sind für Ersteller und öffentlich sichtbar
CREATE POLICY "Levels sind für Ersteller und öffentlich sichtbar"
  ON levels FOR SELECT
  USING (auth.uid() = user_id OR is_public = true);

-- Levels können nur vom Ersteller bearbeitet werden
CREATE POLICY "Levels können nur vom Ersteller bearbeitet werden"
  ON levels FOR UPDATE
  USING (auth.uid() = user_id);

-- Levels können nur vom Ersteller gelöscht werden
CREATE POLICY "Levels können nur vom Ersteller gelöscht werden"
  ON levels FOR DELETE
  USING (auth.uid() = user_id);

-- Neue Levels können nur vom authentifizierten Benutzer erstellt werden
CREATE POLICY "Neue Levels können nur vom authentifizierten Benutzer erstellt werden"
  ON levels FOR INSERT
  WITH CHECK (auth.uid() = user_id);
```

### 2. Level Likes

```sql
-- Likes können von jedem authentifizierten Benutzer gesehen werden
CREATE POLICY "Likes können von jedem authentifizierten Benutzer gesehen werden"
  ON level_likes FOR SELECT
  USING (true);

-- Likes können nur vom Benutzer selbst erstellt werden
CREATE POLICY "Likes können nur vom Benutzer selbst erstellt werden"
  ON level_likes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Likes können nur vom Benutzer selbst entfernt werden
CREATE POLICY "Likes können nur vom Benutzer selbst entfernt werden"
  ON level_likes FOR DELETE
  USING (auth.uid() = user_id);
```

### 3. Level Plays

```sql
-- Spielstatistiken sind für Level-Ersteller sichtbar
CREATE POLICY "Spielstatistiken sind für Level-Ersteller sichtbar"
  ON level_plays FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM levels
    WHERE levels.id = level_plays.level_id
    AND levels.user_id = auth.uid()
  ) OR auth.uid() = user_id);

-- Spielstatistiken können von jedem authentifizierten Benutzer erstellt werden
CREATE POLICY "Spielstatistiken können von jedem authentifizierten Benutzer erstellt werden"
  ON level_plays FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Spielstatistiken können nur vom Benutzer selbst aktualisiert werden
CREATE POLICY "Spielstatistiken können nur vom Benutzer selbst aktualisiert werden"
  ON level_plays FOR UPDATE
  USING (auth.uid() = user_id);
```

## Datenformat

### Voxel-Daten (JSONB)

Die Voxel-Daten werden als JSONB in der `voxel_data`-Spalte gespeichert. Das Format ist:

```json
{
	"x,y,z": {
		"type": "blockType",
		"isSpawnPoint": false,
		"isGoal": false
	},
	"1,1,1": {
		"type": "grass",
		"isSpawnPoint": true,
		"isGoal": false
	},
	"5,1,5": {
		"type": "goal",
		"isSpawnPoint": false,
		"isGoal": true
	}
}
```

Wobei:

- Der Schlüssel ist eine Zeichenkette im Format "x,y,z", die die Position des Blocks angibt
- `type` ist der Typ des Blocks (z.B. "grass", "stone", "lava")
- `isSpawnPoint` gibt an, ob dieser Block ein Spawn-Punkt ist
- `isGoal` gibt an, ob dieser Block ein Ziel ist

## Verwendung in der Anwendung

Die Datenbank wird über den Supabase-Client in der Anwendung angesprochen. Dafür wurden folgende Services implementiert:

1. `LevelService`: Zum Speichern, Laden und Verwalten von Levels
2. `AuthService`: Für die Benutzerauthentifizierung

Beispiel für die Verwendung des `LevelService`:

```typescript
import { LevelService } from '../services/LevelService';

// Level speichern
const level = {
	name: 'Mein Level',
	blocks: [
		/* ... */
	],
	spawnPoint: { x: 1, y: 1, z: 1 },
	worldSize: { width: 20, height: 10, depth: 20 },
	isPublic: true,
};
const levelId = await LevelService.saveLevel(level);

// Level laden
const loadedLevel = await LevelService.loadLevel(levelId);

// Öffentliche Levels abrufen
const publicLevels = await LevelService.getPublicLevels();

// Level liken
await LevelService.likeLevel(levelId);
```

## Erweiterungsmöglichkeiten

Die Datenbankstruktur kann in Zukunft um folgende Funktionen erweitert werden:

1. **Kommentare**: Eine neue Tabelle für Kommentare zu Levels
2. **Leaderboards**: Detaillierte Bestenlisten für jedes Level
3. **Benutzerprofile**: Erweiterte Benutzerinformationen und Statistiken
4. **Freundschaften**: Beziehungen zwischen Benutzern
5. **Sammlungen**: Gruppierung von Levels in Sammlungen oder Playlists
