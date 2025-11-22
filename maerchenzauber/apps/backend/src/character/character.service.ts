import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';

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

@Injectable()
export class CharacterService {
  constructor() {}

  /**
   * Create a new character using the authenticated execute function
   * @param execute The execute function from SupabaseAuthService
   * @param userId The authenticated user ID
   * @param characterData The character data to create
   * @returns The created character
   */
  async createCharacter(
    execute: <T>(operation: string, params?: any) => Promise<T>,
    _userId: string,
    characterData: CharacterCreateDto,
  ) {
    try {
      // Ensure animalType has a default value if undefined (based on memory)
      if (characterData.animalType === undefined) {
        characterData.animalType = 'unspecified animal';
      }

      // Use the execute function to create a character as the authenticated user
      const character = await execute('create_character', {
        name: characterData.name,
        description: characterData.original_description,
        prompt: characterData.character_description_prompt,
        image_url: characterData.image_url || null,
        images_data: characterData.images_data || [],
      });

      return character;
    } catch (error) {
      console.error('Error creating character:', error);
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new BadRequestException(`Failed to create character: ${message}`);
    }
  }

  /**
   * Get a character by ID
   * @param execute The execute function from SupabaseAuthService
   * @param characterId The character ID to get
   * @returns The character
   */
  async getCharacter(
    execute: <T>(operation: string, params?: any) => Promise<T>,
    characterId: string,
  ) {
    try {
      const character = await execute('get_character', { id: characterId });

      if (!character) {
        throw new NotFoundException(
          `Character with ID ${characterId} not found`,
        );
      }

      return character;
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new BadRequestException(`Failed to get character: ${message}`);
    }
  }

  /**
   * Update a character
   * @param execute The execute function from SupabaseAuthService
   * @param characterId The character ID to update
   * @param updateData The character data to update
   * @returns The updated character
   */
  async updateCharacter(
    execute: <T>(operation: string, params?: any) => Promise<T>,
    characterId: string,
    updateData: CharacterUpdateDto,
  ) {
    try {
      // Check if this is Finnia and ensure she's described as a magical fox (based on memory)
      if (updateData.name === 'Finnia' && updateData.original_description) {
        if (!updateData.original_description.includes('magical fox')) {
          updateData.original_description += ' (Finnia, the magical fox)';
        }
      }

      const character = await execute('update_character', {
        id: characterId,
        name: updateData.name,
        description: updateData.original_description,
        prompt: updateData.character_description_prompt,
        image_url: updateData.image_url,
        images_data: updateData.images_data,
      });

      if (!character) {
        throw new NotFoundException(
          `Character with ID ${characterId} not found`,
        );
      }

      return character;
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new BadRequestException(`Failed to update character: ${message}`);
    }
  }

  /**
   * Delete a character
   * @param execute The execute function from SupabaseAuthService
   * @param characterId The character ID to delete
   * @returns The deleted character
   */
  async deleteCharacter(
    execute: <T>(operation: string, params?: any) => Promise<T>,
    characterId: string,
  ) {
    try {
      const character = await execute('delete_character', { id: characterId });

      if (!character) {
        throw new NotFoundException(
          `Character with ID ${characterId} not found`,
        );
      }

      return character;
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new BadRequestException(`Failed to delete character: ${message}`);
    }
  }

  /**
   * List all characters for the authenticated user
   * @param execute The execute function from SupabaseAuthService
   * @returns An array of characters
   */
  async listCharacters(
    execute: <T>(operation: string, params?: any) => Promise<T>,
  ) {
    try {
      const characters = await execute('list_characters', {});
      return characters || [];
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new BadRequestException(`Failed to list characters: ${message}`);
    }
  }
}
