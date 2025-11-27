/**
 * Repräsentiert einen einzelnen Block im Voxel-Spiel
 */
export interface Block {
  /** X-Koordinate des Blocks */
  x: number;
  /** Y-Koordinate des Blocks */
  y: number;
  /** Z-Koordinate des Blocks */
  z: number;
  /** Typ des Blocks (z.B. 'grass', 'stone', 'lava') */
  type: string;
  /** Gibt an, ob dieser Block ein Spawn-Punkt ist */
  isSpawnPoint?: boolean;
  /** Gibt an, ob dieser Block ein Ziel ist */
  isGoal?: boolean;
}

/**
 * Repräsentiert die Größe der Spielwelt
 */
export interface WorldSize {
  /** Breite der Welt in Blöcken */
  width: number;
  /** Höhe der Welt in Blöcken */
  height: number;
  /** Tiefe der Welt in Blöcken */
  depth: number;
}

/**
 * Repräsentiert die Position des Spawn-Punkts
 */
export interface SpawnPoint {
  /** X-Koordinate des Spawn-Punkts */
  x: number;
  /** Y-Koordinate des Spawn-Punkts */
  y: number;
  /** Z-Koordinate des Spawn-Punkts */
  z: number;
}

/**
 * Repräsentiert die Metadaten eines Levels (ohne Blockdaten)
 */
export interface LevelMetadata {
  /** Eindeutige ID des Levels */
  id: string;
  /** Name des Levels */
  name: string;
  /** Beschreibung des Levels */
  description: string;
  /** ID des Benutzers, der das Level erstellt hat */
  userId: string;
  /** Zeitpunkt der Erstellung des Levels */
  createdAt: string;
  /** Zeitpunkt der letzten Aktualisierung des Levels */
  updatedAt: string;
  /** Gibt an, ob das Level öffentlich ist */
  isPublic?: boolean;
  /** Anzahl der Aufrufe des Levels */
  playCount: number;
  /** Anzahl der Likes des Levels */
  likesCount: number;
  /** Schwierigkeitsgrad des Levels */
  difficulty?: string;
  /** Tags zur Kategorisierung des Levels */
  tags?: string[];
  /** URL zum Vorschaubild des Levels */
  thumbnailUrl?: string;
}

/**
 * Repräsentiert ein vollständiges Level mit allen Daten
 */
export interface Level extends LevelMetadata {
  /** Liste aller Blöcke im Level */
  blocks: Block[];
  /** Position des Spawn-Punkts */
  spawnPoint: SpawnPoint;
  /** Größe der Spielwelt */
  worldSize: WorldSize;
}
