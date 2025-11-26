import { defineCollection, z } from 'astro:content';

const appsCollection = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    description: z.string(),
    category: z.enum(['productivity', 'ai-tools', 'creative', 'communication', 'analytics', 'wellness']),
    icon: z.string(),
    manaUsage: z.object({
      min: z.number(),
      average: z.number(),
      max: z.number(),
      unit: z.enum(['per-action', 'per-minute', 'per-request', 'per-image', 'per-token'])
    }),
    features: z.array(z.string()),
    status: z.enum(['available', 'coming-soon', 'beta']),
    order: z.number(),
    website: z.string().optional(),
    screenshots: z.array(z.string()).optional(),
  })
});

const targetGroupsCollection = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    description: z.string(),
    icon: z.string(),
    benefits: z.array(z.string()),
    useCases: z.array(z.string()),
    testimonial: z.object({
      quote: z.string(),
      author: z.string(),
      role: z.string(),
      company: z.string().optional(),
    }).optional(),
    pricing: z.object({
      special: z.boolean(),
      discount: z.string().optional(),
      details: z.string(),
    }),
    order: z.number(),
  })
});

const legalCollection = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    description: z.string(),
    lastUpdated: z.date(),
    order: z.number(),
    sections: z.array(z.object({
      heading: z.string(),
      content: z.string(),
    })).optional(),
  })
});

const privacyCollection = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    description: z.string(),
    category: z.enum(['compliance', 'security', 'ai-ethics', 'transparency']),
    lastUpdated: z.date(),
    order: z.number(),
    featured: z.boolean().default(false),
    tags: z.array(z.string()).optional(),
  })
});

const clientsCollection = defineCollection({
  type: 'content',
  schema: z.object({
    company: z.string(),
    logo: z.string(),
    industry: z.string(),
    size: z.enum(['startup', 'mittelstand', 'enterprise']),
    location: z.string(),
    testimonial: z.object({
      quote: z.string(),
      author: z.string(),
      role: z.string(),
      image: z.string().optional(),
    }),
    stats: z.array(z.object({
      value: z.string(),
      label: z.string(),
    })),
    challenge: z.string(),
    solution: z.string(),
    results: z.array(z.string()),
    manaUsage: z.object({
      monthlyCredits: z.number(),
      mainTools: z.array(z.string()),
      teamSize: z.number(),
    }),
    featured: z.boolean().default(false),
    order: z.number(),
  })
});

const missionCollection = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    description: z.string(),
    category: z.enum(['vision', 'values', 'approach', 'team', 'future']),
    image: z.string().optional(),
    order: z.number(),
    featured: z.boolean().default(false),
    lang: z.enum(['de', 'en', 'it']).default('de'),
  })
});

const contextCollection = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    description: z.string(),
    order: z.number(),
    icon: z.string().optional(),
    publishedAt: z.date().optional(),
    updatedAt: z.date().optional(),
  }),
});

export const collections = {
  apps: appsCollection,
  'branchen': targetGroupsCollection,
  'legal': legalCollection,
  'privacy': privacyCollection,
  'clients': clientsCollection,
  'mission': missionCollection,
  'context': contextCollection,
};