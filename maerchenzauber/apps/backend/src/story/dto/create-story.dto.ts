import { z } from 'zod';

export const createStorySchema = z.object({
  characters: z.array(z.string()),
  storyDescription: z.string(),
  authorId: z.string().optional(),
  illustratorId: z.string().optional(),
});

export type CreateStoryDto = z.infer<typeof createStorySchema>;

export const createAnimalStorySchema = z.object({
  storyDescription: z.string(),
  characterId: z.string(),
  animalType: z.string().optional(), // Optional specific animal type
  authorId: z.string().optional(),
  illustratorId: z.string().optional(),
});

export const createStoryWithAnimalCharacterSchema = z.object({
  characters: z.array(z.string()),
  storyDescription: z.string(),
  authorId: z.string().optional(),
  illustratorId: z.string().optional(),
});

export type CreateAnimalStoryDto = z.infer<typeof createAnimalStorySchema>;
export type CreateStoryWithAnimalCharacterDto = z.infer<
  typeof createStoryWithAnimalCharacterSchema
>;
