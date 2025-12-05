import { defineCollection, z } from 'astro:content';

// Schema für Developer-Einträge
export const developersCollection = defineCollection({
  type: 'content',
  schema: z.object({
    name: z.string(),
    description: z.string(),
    logo: z.string().optional(),
    website: z.string().url(),
    foundedYear: z.number().optional(),
    headquarters: z.string().optional(),
    country: z.string().optional(),
    employees: z.string().optional(),
    revenue: z.string().optional(),
    industry: z.string().optional(),
    keyProducts: z.array(z.string()).optional(),
    socialMedia: z.object({
      twitter: z.string().optional(),
      linkedin: z.string().optional(),
      github: z.string().optional(),
      facebook: z.string().optional()
    }).optional()
  })
});

// Schema für Software-Einträge
export const softwareCollection = defineCollection({
  type: 'content',
  schema: z.object({
    name: z.string(),
    description: z.string(),
    logo: z.string().optional(),
    website: z.string().url(),
    screenshots: z.array(z.string()).optional(),
    pricing: z.array(z.object({
      model: z.string(),
      price: z.string(),
      yearly_price: z.string().optional(),
      features: z.array(z.string())
    })),
    features: z.array(z.string()),
    categories: z.array(z.string()),
    platforms: z.array(z.string()),
    supportedPlatforms: z.array(z.string()).optional(),
    developer: z.string().optional(),
    lastUpdated: z.coerce.date()
  })
});

// Schema für Kategorien
export const categoriesCollection = defineCollection({
  type: 'content',
  schema: z.object({
    name: z.string(),
    description: z.string(),
    icon: z.string().optional()
  })
});

// Schema für Übersetzungen
export const translationsCollection = defineCollection({
  type: 'data',
});

// i18n-Konfiguration
export const i18nConfig = {
  defaultLocale: 'de',
  locales: ['de', 'en']
};

// Collections registrieren
export const collections = {
  'software': softwareCollection,
  'categories': categoriesCollection,
  'translations': translationsCollection,
  'developers': developersCollection
};