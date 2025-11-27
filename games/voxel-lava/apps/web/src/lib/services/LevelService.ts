import { levelsApi, getToken } from '../api/client';

// Typdefinitionen
interface Block {
  x: number;
  y: number;
  z: number;
  type: string;
  isSpawnPoint?: boolean;
  isGoal?: boolean;
}

interface WorldSize {
  width: number;
  height: number;
  depth: number;
}

interface SpawnPoint {
  x: number;
  y: number;
  z: number;
}

interface LevelMetadata {
  id: string;
  name: string;
  description: string;
  userId: string | null;
  createdAt: string | null;
  updatedAt: string | null;
  isPublic?: boolean | null;
  playCount: number;
  likesCount: number;
  difficulty?: string | undefined;
  tags?: string[];
  thumbnailUrl?: string | undefined;
}

interface Level extends Partial<LevelMetadata> {
  id?: string;
  name: string;
  blocks: Block[];
  spawnPoint: SpawnPoint | null;
  worldSize: WorldSize;
}

/**
 * Service zur Verwaltung von Levels mit NestJS Backend API
 */
export class LevelService {
  /**
   * Speichert ein Level in der Datenbank
   * @param level Das zu speichernde Level
   * @returns Die ID des gespeicherten Levels
   */
  static async saveLevel(level: Level): Promise<string | null> {
    try {
      if (!getToken()) {
        throw new Error('Du musst angemeldet sein, um ein Level zu speichern');
      }

      const levelData = {
        name: level.name,
        description: level.description || '',
        voxelData: this.convertBlocksToVoxelData(level.blocks),
        spawnPoint: level.spawnPoint,
        worldSize: level.worldSize,
        isPublic: level.isPublic || false,
        difficulty: level.difficulty || null,
        tags: level.tags || [],
        thumbnailUrl: level.thumbnailUrl || null,
      };

      if (level.id) {
        const updated = await levelsApi.updateLevel(level.id, levelData);
        return updated.id;
      } else {
        const created = await levelsApi.createLevel(levelData);
        return created.id;
      }
    } catch (error) {
      console.error('Fehler beim Speichern des Levels:', error);
      return null;
    }
  }

  /**
   * Lädt ein Level aus der Datenbank
   * @param levelId Die ID des zu ladenden Levels
   * @returns Das geladene Level oder null, wenn es nicht gefunden wurde
   */
  static async loadLevel(levelId: string): Promise<Level | null> {
    try {
      const record = await levelsApi.getLevel(levelId);

      if (!record) return null;

      return {
        id: record.id,
        name: record.name,
        description: record.description || '',
        blocks: this.convertVoxelDataToBlocks(record.voxelData),
        spawnPoint: record.spawnPoint,
        worldSize: record.worldSize,
        isPublic: record.isPublic || false,
        createdAt: record.createdAt,
        updatedAt: record.updatedAt,
        userId: record.userId,
        playCount: record.playCount || 0,
        likesCount: record.likesCount || 0,
        difficulty: record.difficulty || undefined,
        tags: record.tags || [],
        thumbnailUrl: record.thumbnailUrl || undefined,
      };
    } catch (error) {
      console.error('Fehler beim Laden des Levels:', error);
      return null;
    }
  }

  /**
   * Lädt alle öffentlichen Levels
   * @param page Seitennummer (startet bei 1)
   * @param perPage Anzahl der Einträge pro Seite
   * @returns Liste der Level-Metadaten
   */
  static async getPublicLevels(page = 1, perPage = 20): Promise<LevelMetadata[]> {
    try {
      const response = await levelsApi.getPublicLevels(page, perPage);

      return response.items.map((record) => ({
        id: record.id,
        name: record.name,
        description: record.description || '',
        userId: record.userId,
        createdAt: record.createdAt,
        updatedAt: record.updatedAt,
        playCount: record.playCount || 0,
        likesCount: record.likesCount || 0,
        difficulty: record.difficulty || undefined,
        tags: record.tags || [],
        thumbnailUrl: record.thumbnailUrl || undefined,
      }));
    } catch (error) {
      console.error('Fehler beim Laden der öffentlichen Levels:', error);
      return [];
    }
  }

  /**
   * Lädt alle Levels des aktuellen Benutzers
   * @returns Liste der Level-Metadaten
   */
  static async getUserLevels(): Promise<LevelMetadata[]> {
    try {
      if (!getToken()) {
        throw new Error('Du musst angemeldet sein, um deine Levels zu sehen');
      }

      const records = await levelsApi.getUserLevels();

      return records.map((record) => ({
        id: record.id,
        name: record.name,
        description: record.description || '',
        userId: record.userId,
        createdAt: record.createdAt,
        updatedAt: record.updatedAt,
        isPublic: record.isPublic,
        playCount: record.playCount || 0,
        likesCount: record.likesCount || 0,
        difficulty: record.difficulty || undefined,
        tags: record.tags || [],
        thumbnailUrl: record.thumbnailUrl || undefined,
      }));
    } catch (error) {
      console.error('Fehler beim Laden der Benutzer-Levels:', error);
      return [];
    }
  }

  /**
   * Löscht ein Level aus der Datenbank
   * @param levelId Die ID des zu löschenden Levels
   * @returns true, wenn das Level erfolgreich gelöscht wurde, sonst false
   */
  static async deleteLevel(levelId: string): Promise<boolean> {
    try {
      if (!getToken()) {
        throw new Error('Du musst angemeldet sein, um ein Level zu löschen');
      }

      await levelsApi.deleteLevel(levelId);
      return true;
    } catch (error) {
      console.error('Fehler beim Löschen des Levels:', error);
      return false;
    }
  }

  /**
   * Setzt einen "Like" für ein Level
   * @param levelId Die ID des Levels
   * @returns true, wenn der Like hinzugefügt wurde, false wenn entfernt
   */
  static async likeLevel(levelId: string): Promise<boolean> {
    try {
      if (!getToken()) {
        throw new Error('Du musst angemeldet sein, um ein Level zu liken');
      }

      const result = await levelsApi.toggleLike(levelId);
      return result.liked;
    } catch (error) {
      console.error('Fehler beim Liken des Levels:', error);
      return false;
    }
  }

  /**
   * Prüft, ob der aktuelle Benutzer ein Level geliked hat
   * @param levelId Die ID des Levels
   * @returns true, wenn der Benutzer das Level geliked hat, sonst false
   */
  static async hasLiked(levelId: string): Promise<boolean> {
    try {
      if (!getToken()) return false;

      const result = await levelsApi.hasLiked(levelId);
      return result.liked;
    } catch (error) {
      console.error('Fehler beim Prüfen des Likes:', error);
      return false;
    }
  }

  /**
   * Zeichnet einen Spielversuch auf
   * @param levelId Die ID des Levels
   * @param completed Ob das Level abgeschlossen wurde
   * @param completionTime Die Zeit in Sekunden (optional, nur wenn completed = true)
   * @returns true, wenn der Versuch erfolgreich aufgezeichnet wurde, sonst false
   */
  static async recordPlay(
    levelId: string,
    completed: boolean,
    completionTime?: number
  ): Promise<boolean> {
    try {
      await levelsApi.recordPlay(levelId, completed, completionTime);
      return true;
    } catch (error) {
      console.error('Fehler beim Aufzeichnen des Spielversuchs:', error);
      return false;
    }
  }

  /**
   * Lädt die Bestenliste für ein Level
   * @param levelId Die ID des Levels
   * @param limit Maximale Anzahl der Einträge
   * @returns Liste der besten Completion-Times
   */
  static async getLeaderboard(levelId: string, limit = 10): Promise<any[]> {
    try {
      const records = await levelsApi.getLeaderboard(levelId, limit);

      return records.map((record) => ({
        userId: record.userId,
        userName: 'Spieler', // User name not available without expand
        completionTime: record.completionTime,
        createdAt: record.createdAt,
      }));
    } catch (error) {
      console.error('Fehler beim Laden der Bestenliste:', error);
      return [];
    }
  }

  /**
   * Konvertiert die Blöcke in ein optimiertes JSON-Format für die Datenbank
   */
  private static convertBlocksToVoxelData(blocks: Block[]): any {
    const validBlocks = blocks.filter(
      (block) =>
        block &&
        block.x !== undefined &&
        block.y !== undefined &&
        block.z !== undefined &&
        block.type
    );

    if (validBlocks.length === 0) {
      return {};
    }

    const voxelData: any = {};

    validBlocks.forEach((block) => {
      const key = `${block.x},${block.y},${block.z}`;
      voxelData[key] = {
        type: block.type,
        isSpawnPoint: block.isSpawnPoint || false,
        isGoal: block.isGoal || false,
      };
    });

    return voxelData;
  }

  /**
   * Konvertiert das JSON-Format aus der Datenbank in Blöcke
   */
  private static convertVoxelDataToBlocks(voxelData: any): Block[] {
    const blocks: Block[] = [];

    if (!voxelData || typeof voxelData !== 'object') {
      return blocks;
    }

    // Prüfen, ob es das neue optimierte Format ist
    if (voxelData.format === 'v2' && voxelData.types) {
      Object.entries(voxelData.types).forEach(([type, positions]: [string, any]) => {
        if (Array.isArray(positions)) {
          positions.forEach((pos: number[]) => {
            if (pos.length >= 3) {
              blocks.push({
                x: pos[0],
                y: pos[1],
                z: pos[2],
                type,
                isSpawnPoint: false,
                isGoal: false,
              });
            }
          });
        }
      });

      if (voxelData.special) {
        if (voxelData.special.spawn) {
          const spawn = voxelData.special.spawn;
          const spawnBlock = blocks.find(
            (b) => b.x === spawn.x && b.y === spawn.y && b.z === spawn.z
          );
          if (spawnBlock) {
            spawnBlock.isSpawnPoint = true;
          }
        }

        if (voxelData.special.goals && Array.isArray(voxelData.special.goals)) {
          voxelData.special.goals.forEach((goal: any) => {
            const goalBlock = blocks.find(
              (b) => b.x === goal.x && b.y === goal.y && b.z === goal.z
            );
            if (goalBlock) {
              goalBlock.isGoal = true;
            }
          });
        }
      }
    } else {
      // Altes Format: Position als Key
      Object.entries(voxelData).forEach(([key, value]: [string, any]) => {
        if (key === 'format' || key === 'types' || key === 'special') {
          return;
        }

        const [x, y, z] = key.split(',').map(Number);

        if (!isNaN(x) && !isNaN(y) && !isNaN(z) && value && value.type) {
          blocks.push({
            x,
            y,
            z,
            type: value.type,
            isSpawnPoint: value.isSpawnPoint || false,
            isGoal: value.isGoal || false,
          });
        }
      });
    }

    return blocks;
  }
}

// Default export für Kompatibilität
export default LevelService;
