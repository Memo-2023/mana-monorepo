import { pb } from '../pocketbase';

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
  user_id: string | null;
  created: string | null;
  updated: string | null;
  is_public?: boolean | null;
  play_count: number;
  likes_count: number;
  difficulty?: string | undefined;
  tags?: string[];
  thumbnail_url?: string | undefined;
}

interface Level extends Partial<LevelMetadata> {
  id?: string;
  name: string;
  blocks: Block[];
  spawnPoint: SpawnPoint | null;
  worldSize: WorldSize;
}

/**
 * Service zur Verwaltung von Levels in PocketBase
 */
export class LevelService {
  /**
   * Speichert ein Level in der Datenbank
   * @param level Das zu speichernde Level
   * @returns Die ID des gespeicherten Levels
   */
  static async saveLevel(level: Level): Promise<string | null> {
    try {
      // Prüfen, ob der Benutzer angemeldet ist
      const user = pb.authStore.model;
      if (!user) {
        throw new Error('Du musst angemeldet sein, um ein Level zu speichern');
      }

      // Level-Daten für die Datenbank vorbereiten
      const levelData = {
        name: level.name,
        description: level.description || '',
        user_id: user.id,
        voxel_data: this.convertBlocksToVoxelData(level.blocks),
        spawn_point: level.spawnPoint,
        world_size: level.worldSize,
        is_public: level.is_public || false,
        difficulty: level.difficulty || null,
        tags: level.tags || [],
        play_count: level.play_count || 0,
        likes_count: level.likes_count || 0,
        thumbnail_url: level.thumbnail_url || null
      };

      // Prüfen, ob das Level bereits existiert
      if (level.id) {
        // Level aktualisieren
        const record = await pb.collection('levels').update(level.id, levelData);
        return record.id;
      } else {
        // Neues Level erstellen
        const record = await pb.collection('levels').create(levelData);
        return record.id;
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
      const record = await pb.collection('levels').getOne(levelId);
      
      if (!record) return null;

      // Level-Daten konvertieren
      return {
        id: record.id,
        name: record.name,
        description: record.description || '',
        blocks: this.convertVoxelDataToBlocks(record.voxel_data),
        spawnPoint: record.spawn_point,
        worldSize: record.world_size,
        is_public: record.is_public || false,
        created: record.created,
        updated: record.updated,
        user_id: record.user_id,
        play_count: record.play_count || 0,
        likes_count: record.likes_count || 0,
        difficulty: record.difficulty || undefined,
        tags: record.tags || [],
        thumbnail_url: record.thumbnail_url || undefined,
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
      const records = await pb.collection('levels').getList(page, perPage, {
        filter: 'is_public = true',
        sort: '-created',
      });
      
      return records.items.map(record => ({
        id: record.id,
        name: record.name,
        description: record.description || '',
        user_id: record.user_id,
        created: record.created,
        updated: record.updated,
        play_count: record.play_count || 0,
        likes_count: record.likes_count || 0,
        difficulty: record.difficulty || undefined,
        tags: record.tags || [],
        thumbnail_url: record.thumbnail_url || undefined,
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
      // Prüfen, ob der Benutzer angemeldet ist
      const user = pb.authStore.model;
      if (!user) {
        throw new Error('Du musst angemeldet sein, um deine Levels zu sehen');
      }

      const records = await pb.collection('levels').getFullList({
        filter: `user_id = "${user.id}"`,
        sort: '-updated',
      });
      
      return records.map(record => ({
        id: record.id,
        name: record.name,
        description: record.description || '',
        user_id: user.id,
        created: record.created,
        updated: record.updated,
        is_public: record.is_public,
        play_count: record.play_count || 0,
        likes_count: record.likes_count || 0,
        difficulty: record.difficulty || undefined,
        tags: record.tags || [],
        thumbnail_url: record.thumbnail_url || undefined,
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
      // Prüfen, ob der Benutzer angemeldet ist
      const user = pb.authStore.model;
      if (!user) {
        throw new Error('Du musst angemeldet sein, um ein Level zu löschen');
      }

      // Erst prüfen, ob das Level dem User gehört
      const level = await pb.collection('levels').getOne(levelId);
      if (level.user_id !== user.id) {
        throw new Error('Du kannst nur deine eigenen Levels löschen');
      }

      await pb.collection('levels').delete(levelId);
      return true;
    } catch (error) {
      console.error('Fehler beim Löschen des Levels:', error);
      return false;
    }
  }

  /**
   * Setzt einen "Like" für ein Level
   * @param levelId Die ID des Levels
   * @returns true, wenn der Like erfolgreich gesetzt wurde, sonst false
   */
  static async likeLevel(levelId: string): Promise<boolean> {
    try {
      // Prüfen, ob der Benutzer angemeldet ist
      const user = pb.authStore.model;
      if (!user) {
        throw new Error('Du musst angemeldet sein, um ein Level zu liken');
      }

      // Prüfen, ob der Benutzer das Level bereits geliked hat
      const existingLikes = await pb.collection('level_likes').getList(1, 1, {
        filter: `level_id = "${levelId}" && user_id = "${user.id}"`
      });

      if (existingLikes.items.length > 0) {
        // Like entfernen
        await pb.collection('level_likes').delete(existingLikes.items[0].id);
        
        // Likes-Count im Level aktualisieren
        const level = await pb.collection('levels').getOne(levelId);
        await pb.collection('levels').update(levelId, {
          likes_count: Math.max(0, (level.likes_count || 0) - 1)
        });
        
        return false; // Like wurde entfernt
      } else {
        // Like hinzufügen
        await pb.collection('level_likes').create({
          level_id: levelId,
          user_id: user.id
        });
        
        // Likes-Count im Level aktualisieren
        const level = await pb.collection('levels').getOne(levelId);
        await pb.collection('levels').update(levelId, {
          likes_count: (level.likes_count || 0) + 1
        });
        
        return true; // Like wurde hinzugefügt
      }
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
      // Prüfen, ob der Benutzer angemeldet ist
      const user = pb.authStore.model;
      if (!user) return false;

      const likes = await pb.collection('level_likes').getList(1, 1, {
        filter: `level_id = "${levelId}" && user_id = "${user.id}"`
      });

      return likes.items.length > 0;
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
  static async recordPlay(levelId: string, completed: boolean, completionTime?: number): Promise<boolean> {
    try {
      // Prüfen, ob der Benutzer angemeldet ist
      const user = pb.authStore.model;
      
      if (!user) {
        // Für nicht angemeldete Benutzer nur den Play-Count erhöhen
        const level = await pb.collection('levels').getOne(levelId);
        await pb.collection('levels').update(levelId, {
          play_count: (level.play_count || 0) + 1
        });
        return true;
      }

      // Prüfen, ob bereits ein Spielversuch existiert
      const existingPlays = await pb.collection('level_plays').getList(1, 1, {
        filter: `level_id = "${levelId}" && user_id = "${user.id}"`,
        sort: '-created'
      });

      if (existingPlays.items.length > 0) {
        // Vorhandenen Spielversuch aktualisieren
        const play = existingPlays.items[0];
        await pb.collection('level_plays').update(play.id, {
          attempts: (play.attempts || 1) + 1,
          completed: completed || play.completed,
          completion_time: completed && completionTime ? completionTime : play.completion_time
        });
      } else {
        // Neuen Spielversuch erstellen
        await pb.collection('level_plays').create({
          level_id: levelId,
          user_id: user.id,
          completed,
          completion_time: completed ? completionTime : null,
          attempts: 1
        });
      }

      // Play-Count im Level erhöhen
      const level = await pb.collection('levels').getOne(levelId);
      await pb.collection('levels').update(levelId, {
        play_count: (level.play_count || 0) + 1
      });

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
      const records = await pb.collection('level_plays').getList(1, limit, {
        filter: `level_id = "${levelId}" && completed = true && completion_time > 0`,
        sort: 'completion_time',
        expand: 'user_id'
      });

      return records.items.map(record => ({
        user_id: record.user_id,
        user_name: record.expand?.user_id?.name || 'Unbekannt',
        completion_time: record.completion_time,
        attempts: record.attempts || 1
      }));
    } catch (error) {
      console.error('Fehler beim Laden der Bestenliste:', error);
      return [];
    }
  }

  /**
   * Konvertiert die Blöcke in ein optimiertes JSON-Format für die Datenbank
   * @param blocks Die zu konvertierenden Blöcke
   * @returns Die konvertierten Blöcke im optimierten JSON-Format
   */
  private static convertBlocksToVoxelData(blocks: Block[]): any {
    // Filtere ungültige Blöcke heraus
    const validBlocks = blocks.filter(block => 
      block && 
      block.x !== undefined && 
      block.y !== undefined && 
      block.z !== undefined && 
      block.type
    );
    
    if (validBlocks.length === 0) {
      return {};
    }

    // Einfaches Format: Position als Key, Block-Daten als Value
    const voxelData: any = {};
    
    validBlocks.forEach(block => {
      const key = `${block.x},${block.y},${block.z}`;
      voxelData[key] = {
        type: block.type,
        isSpawnPoint: block.isSpawnPoint || false,
        isGoal: block.isGoal || false
      };
    });
    
    return voxelData;
  }

  /**
   * Konvertiert das JSON-Format aus der Datenbank in Blöcke
   * @param voxelData Die zu konvertierenden Daten im JSON-Format
   * @returns Die konvertierten Blöcke
   */
  private static convertVoxelDataToBlocks(voxelData: any): Block[] {
    const blocks: Block[] = [];
    
    if (!voxelData || typeof voxelData !== 'object') {
      return blocks;
    }

    // Prüfen, ob es das neue optimierte Format ist
    if (voxelData.format === 'v2' && voxelData.types) {
      // Neues Format: Konvertiere zurück zu Blöcken
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
                isGoal: false
              });
            }
          });
        }
      });

      // Spezielle Blöcke hinzufügen
      if (voxelData.special) {
        if (voxelData.special.spawn) {
          const spawn = voxelData.special.spawn;
          const spawnBlock = blocks.find(b => b.x === spawn.x && b.y === spawn.y && b.z === spawn.z);
          if (spawnBlock) {
            spawnBlock.isSpawnPoint = true;
          }
        }

        if (voxelData.special.goals && Array.isArray(voxelData.special.goals)) {
          voxelData.special.goals.forEach((goal: any) => {
            const goalBlock = blocks.find(b => b.x === goal.x && b.y === goal.y && b.z === goal.z);
            if (goalBlock) {
              goalBlock.isGoal = true;
            }
          });
        }
      }
    } else {
      // Altes Format: Position als Key
      Object.entries(voxelData).forEach(([key, value]: [string, any]) => {
        // Überspringe Metadaten-Keys
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
            isGoal: value.isGoal || false
          });
        }
      });
    }
    
    return blocks;
  }
}

// Default export für Kompatibilität
export default LevelService;