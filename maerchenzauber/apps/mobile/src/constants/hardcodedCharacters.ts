import { Character } from '../../types/character';

// Direct image import for Finia
const FiniaImage = require('../../assets/images/content/finnia/1762453771144-cmngxj-large.jpg');

/**
 * Hardcoded featured characters that are always available to all users
 * These characters appear at the top of the character list
 */

export const HARDCODED_CHARACTERS: (Character & { id: string; isFeatured: boolean })[] = [
  {
    id: 'HARDCODED_finia',
    uid: 'HARDCODED_finia',
    name: 'Finia',
    originalDescription: 'Eine Mutter weibliche Füchsin, mit rot goldenem Fell. Sie hat einen großen Fuchsschwanz der rot golden lodert, wie Flammen mit Magie. Sie sieht weise, ruhig und gelassen aus. Sie hat ein grünes Halstuch an.',
    characterDescriptionPrompt: 'A wise mother fox with red-golden fur. She has a large fox tail that glows red-gold like flames with magic. She appears wise, calm and composed. She wears a green neckerchief. Mystical and nurturing appearance.',
    images: [
      {
        description: 'Portrait von Finia, der magischen Füchsin',
        imageUrl: 'local://finia'
      }
    ],
    imageUrl: 'local://finia',
    createdAt: new Date('2024-01-01'), // Fixed date for featured character
    archived: false,
    isAnimal: true,
    animalType: 'fox',
    isFeatured: true,
    // No share_code - featured characters are not shareable
  }
];

/**
 * Get local image source for hardcoded characters
 * Maps the special 'local://' URLs to actual require() statements
 */
export function getLocalImageSource(imageUrl: string): any {
  if (!imageUrl.startsWith('local://')) {
    return null;
  }

  const path = imageUrl.replace('local://', '');

  // Map paths to actual image files - using pre-imported images
  const imageMap: Record<string, any> = {
    'finia': FiniaImage,
  };

  const source = imageMap[path];
  return source || null;
}

/**
 * Check if a character is a hardcoded featured character
 */
export function isHardcodedCharacter(characterId: string): boolean {
  return characterId.startsWith('HARDCODED_');
}
