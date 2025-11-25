import { Injectable } from '@nestjs/common';
import {
  type AsyncResult,
  ok,
  err,
  NotFoundError,
  DatabaseError,
} from '@manacore/shared-errors';

// Define interfaces for our character data
export interface CharacterCreateDto {
  name: string;
  original_description: string;
  character_description_prompt: string;
  image_url?: string;
  animalType?: string; // Added based on memory about animalType being undefined
  images_data?: any[];
}

export interface CharacterUpdateDto {
  name?: string;
  original_description?: string;
  character_description_prompt?: string;
  image_url?: string;
  animalType?: string;
  images_data?: any[];
}

// Character type for return values
export interface Character {
  id: string;
  name: string;
  original_description?: string;
  character_description_prompt?: string;
  character_description?: string;
  image_url?: string;
  animal_type?: string;
  images_data?: any[];
  user_id: string;
  created_at: string;
  updated_at: string;
}

@Injectable()
export class CharacterService {
  constructor() {}

  /**
   * Create a new character using the authenticated execute function
   * @param execute The execute function from SupabaseAuthService
   * @param userId The authenticated user ID
   * @param characterData The character data to create
   * @returns Result containing the created character or error
   */
  async createCharacter(
    execute: <T>(operation: string, params?: any) => Promise<T>,
    _userId: string,
    characterData: CharacterCreateDto,
  ): AsyncResult<Character> {
    try {
      // Ensure animalType has a default value if undefined (based on memory)
      if (characterData.animalType === undefined) {
        characterData.animalType = 'unspecified animal';
      }

      // Use the execute function to create a character as the authenticated user
      const character = await execute<Character>('create_character', {
        name: characterData.name,
        description: characterData.original_description,
        prompt: characterData.character_description_prompt,
        image_url: characterData.image_url || null,
        images_data: characterData.images_data || [],
      });

      return ok(character);
    } catch (error) {
      console.error('Error creating character:', error);
      return err(
        DatabaseError.queryFailed(
          'create_character',
          error instanceof Error ? error.message : 'Unknown error',
          error instanceof Error ? error : undefined,
        ),
      );
    }
  }

  /**
   * Get a character by ID
   * @param execute The execute function from SupabaseAuthService
   * @param characterId The character ID to get
   * @returns Result containing the character or error
   */
  async getCharacter(
    execute: <T>(operation: string, params?: any) => Promise<T>,
    characterId: string,
  ): AsyncResult<Character> {
    try {
      const character = await execute<Character | null>('get_character', { id: characterId });

      if (!character) {
        return err(NotFoundError.resource('Character', characterId));
      }

      return ok(character);
    } catch (error) {
      console.error('Error getting character:', error);
      return err(
        DatabaseError.queryFailed(
          'get_character',
          error instanceof Error ? error.message : 'Unknown error',
          error instanceof Error ? error : undefined,
        ),
      );
    }
  }

  /**
   * Update a character
   * @param execute The execute function from SupabaseAuthService
   * @param characterId The character ID to update
   * @param updateData The character data to update
   * @returns Result containing the updated character or error
   */
  async updateCharacter(
    execute: <T>(operation: string, params?: any) => Promise<T>,
    characterId: string,
    updateData: CharacterUpdateDto,
  ): AsyncResult<Character> {
    try {
      // Check if this is Finnia and ensure she's described as a magical fox (based on memory)
      if (updateData.name === 'Finnia' && updateData.original_description) {
        if (!updateData.original_description.includes('magical fox')) {
          updateData.original_description += ' (Finnia, the magical fox)';
        }
      }

      const character = await execute<Character | null>('update_character', {
        id: characterId,
        name: updateData.name,
        description: updateData.original_description,
        prompt: updateData.character_description_prompt,
        image_url: updateData.image_url,
        images_data: updateData.images_data,
      });

      if (!character) {
        return err(NotFoundError.resource('Character', characterId));
      }

      return ok(character);
    } catch (error) {
      console.error('Error updating character:', error);
      return err(
        DatabaseError.queryFailed(
          'update_character',
          error instanceof Error ? error.message : 'Unknown error',
          error instanceof Error ? error : undefined,
        ),
      );
    }
  }

  /**
   * Delete a character
   * @param execute The execute function from SupabaseAuthService
   * @param characterId The character ID to delete
   * @returns Result containing the deleted character or error
   */
  async deleteCharacter(
    execute: <T>(operation: string, params?: any) => Promise<T>,
    characterId: string,
  ): AsyncResult<Character> {
    try {
      const character = await execute<Character | null>('delete_character', { id: characterId });

      if (!character) {
        return err(NotFoundError.resource('Character', characterId));
      }

      return ok(character);
    } catch (error) {
      console.error('Error deleting character:', error);
      return err(
        DatabaseError.queryFailed(
          'delete_character',
          error instanceof Error ? error.message : 'Unknown error',
          error instanceof Error ? error : undefined,
        ),
      );
    }
  }

  /**
   * List all characters for the authenticated user
   * @param execute The execute function from SupabaseAuthService
   * @returns Result containing an array of characters or error
   */
  async listCharacters(
    execute: <T>(operation: string, params?: any) => Promise<T>,
  ): AsyncResult<Character[]> {
    try {
      const characters = await execute<Character[] | null>('list_characters', {});
      return ok(characters || []);
    } catch (error) {
      console.error('Error listing characters:', error);
      return err(
        DatabaseError.queryFailed(
          'list_characters',
          error instanceof Error ? error.message : 'Unknown error',
          error instanceof Error ? error : undefined,
        ),
      );
    }
  }
}
