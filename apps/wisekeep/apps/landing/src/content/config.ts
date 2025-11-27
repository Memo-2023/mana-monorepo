import { defineCollection, z } from 'astro:content';

const talks = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    speaker: z.string(),
    date: z.coerce.date(),
    category: z.enum([
      'behavioral-economics',
      'psychology',
      'technology',
      'innovation',
      'marketing',
      'philosophy',
      'business',
      'creativity',
      'leadership'
    ]),
    tags: z.array(z.string()),
    venue: z.string(),
    duration: z.string(),
    videoUrl: z.string().url(),
    thumbnail: z.string().optional(),
    readingTime: z.number(),
    featured: z.boolean().default(false),
    summary: z.string(),
  }),
});

export const collections = { talks };