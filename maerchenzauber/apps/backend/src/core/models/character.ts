export interface Character {
  uid: string;
  name: string;
  userDescription?: string; // Raw user input (e.g., "schwurti das fette schwein")
  characterDescription: string; // AI-enhanced detailed description for consistent illustrations
  characterDescriptionPrompt: string;
  images: CustomImage[];
  imageUrl: string;
  createdAt: Date;
  isAnimal?: boolean;
  animalType?: string;
  sourceImageUrl?: string; // URL of the original uploaded image (for 'generate-animal-from-image' feature)

  // Database field names (snake_case) - these match the actual Supabase schema
  user_id?: string;
  original_description?: string; // Raw user input
  character_description?: string; // AI-enhanced detailed description
  character_description_prompt?: string;
  image_url?: string;
  created_at?: string;
  is_animal?: boolean;
  animal_type?: string;
  source_image_url?: string;
  images_data?: any[];
}

export interface CustomImage {
  description: string;
  imageUrl: string;
}
