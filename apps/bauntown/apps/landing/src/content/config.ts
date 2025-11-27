import { defineCollection, z } from 'astro:content';

const toolsCollection = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    description: z.string(),
    pubDate: z.date(),
    updatedDate: z.date().optional(),
    category: z.enum(['Design', 'Development', 'Productivity', 'Hosting']),
    image: z.string().optional(),
    author: z.string().default('BaunTown'),
    featured: z.boolean().default(false),
    website: z.string().optional(),
    pricing: z.enum(['Free', 'Freemium', 'Paid']).default('Freemium'),
    tags: z.array(z.string()).optional(),
    externalLinks: z.array(z.object({
      title: z.string(),
      url: z.string(),
    })).optional(),
  }),
});

const newsCollection = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    description: z.string(),
    pubDate: z.date(),
    updatedDate: z.date().optional(),
    category: z.enum(['AI', 'Web', 'Development', 'Design', 'Community', 'Product']),
    image: z.string().optional(),
    author: z.string().default('BaunTown'),
    featured: z.boolean().default(false),
    tags: z.array(z.string()).optional(),
    externalLinks: z.array(z.object({
      title: z.string(),
      url: z.string(),
    })).optional(),
  }),
});

const modelsCollection = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    description: z.string(),
    pubDate: z.date(),
    updatedDate: z.date().optional(),
    category: z.enum(['Text', 'Bild']),
    image: z.string().optional(),
    author: z.string().default('BaunTown'),
    featured: z.boolean().default(false),
    tags: z.array(z.string()).optional(),
    externalLinks: z.array(z.object({
      title: z.string(),
      url: z.string(),
    })).optional(),
  }),
});

const projectsCollection = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    description: z.string(),
    pubDate: z.date(),
    updatedDate: z.date().optional(),
    category: z.enum(['Web', 'Mobile', 'Desktop', 'IoT', 'AI', 'Design']),
    image: z.string().optional(),
    author: z.string().default('BaunTown'),
    featured: z.boolean().default(false),
    status: z.enum(['active', 'completed', 'archived']).default('active'),
    tags: z.array(z.string()).optional(),
    githubUrl: z.string().optional(),
    demoUrl: z.string().optional(),
    technologies: z.array(z.string()).optional(),
  }),
});

const tutorialsCollection = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    description: z.string(),
    pubDate: z.date(),
    updatedDate: z.date().optional(),
    category: z.enum(['UI & UX', 'Business', 'Users', 'Branding', 'Marketing', 'Vibecoding']),
    image: z.string().optional(),
    author: z.string().default('BaunTown'),
    featured: z.boolean().default(false),
    // Course related fields
    course: z.string().optional(),
    courseName: z.string().optional(),
    lessonNumber: z.number().optional(),
  }),
});

const missionsCollection = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    description: z.string(),
    pubDate: z.date(),
    updatedDate: z.date().optional(),
    difficulty: z.enum(['beginner', 'intermediate', 'advanced']),
    duration: z.string(), // e.g. "2-3 hours", "1 day"
    skills: z.array(z.string()),
    image: z.string().optional(),
    featured: z.boolean().default(false),
    category: z.enum(['UI & UX', 'Business', 'Users', 'Branding', 'Marketing', 'Vibecoding']).default('UI & UX'),
    status: z.enum(['active', 'completed', 'upcoming']).default('active'),
    participants: z.array(z.string()).optional(),
    githubRepo: z.string().optional(),
  }),
});

const visionCollection = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    description: z.string(),
    pubDate: z.date(),
    updatedDate: z.date().optional(),
    image: z.string().optional(),
    featured: z.boolean().default(false),
    category: z.enum(['product', 'technology', 'community', 'future']),
    timeline: z.string(), // e.g. "2025-2030", "Long-term"
    status: z.enum(['current', 'planned', 'exploring']),
    contributors: z.array(z.string()).optional(),
    relatedLinks: z.array(z.object({
      title: z.string(),
      url: z.string(),
    })).optional(),
  }),
});

const joinCollection = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    description: z.string(),
    pubDate: z.date(),
    updatedDate: z.date().optional(),
    image: z.string().optional(),
    heroTitle: z.string().optional(),
    heroDescription: z.string().optional(),
    newsletterTitle: z.string().optional(),
    newsletterDescription: z.string().optional(),
    submissionTitle: z.string().optional(),
    submissionDescription: z.string().optional(),
  }),
});

const membersCollection = defineCollection({
  type: 'content',
  schema: z.object({
    name: z.string(),
    role: z.string(),
    bio: z.string(),
    image: z.string().optional(),
    github: z.string().optional(),
    twitter: z.string().optional(),
    linkedin: z.string().optional(),
    website: z.string().optional(),
    featured: z.boolean().default(false),
    order: z.number().default(999),
  }),
});

export const collections = {
  'news': newsCollection,
  'models': modelsCollection,
  'projects': projectsCollection,
  'tutorials': tutorialsCollection,
  'missions': missionsCollection,
  'vision': visionCollection,
  'join': joinCollection,
  'members': membersCollection,
  'tools': toolsCollection,
};