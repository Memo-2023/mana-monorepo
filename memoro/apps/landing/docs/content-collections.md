# Memoro Content Collections Documentation

This document provides a comprehensive overview of all content collections used in the Memoro website. Each collection is structured with Zod schemas for type safety and validation.

## Quick Overview

The Memoro website contains 15 content collections:

1. **Blog** - Articles and blog posts about features and updates
2. **Team** - Team member profiles (core team, freelancers, mentors, supporters, alumni)
3. **Guides** - How-to tutorials with difficulty levels (beginner, intermediate, advanced)
4. **Features** - Product feature descriptions with icons and categories
5. **Legal** - Legal documents (privacy policy, terms of service)
6. **Industries** - Industry-specific use cases and solutions
7. **Testimonials** - Customer reviews organized by type (private, company, network, press)
8. **Pages** - Structured content for special pages like pricing with Mana system
9. **Contracts** - Downloadable legal contracts and agreements
10. **Blueprints** - Pre-configured templates for different use cases
11. **Memories** - Memory templates and examples
12. **Wallpapers** - Downloadable wallpapers in multiple formats and resolutions
13. **FAQs** - Frequently asked questions by category
14. **Statistics** - Weekly/monthly reports with usage metrics
15. **Changelog** - Product updates and release notes with semantic versioning

## Overview

The Memoro website uses Astro's content collections to manage various types of content. All collections support internationalization with German (de) and English (en) locales.

## Collections

### 1. Blog Collection

**Purpose**: Articles and blog posts about Memoro features, updates, and industry insights.

**Schema**:
```typescript
{
  title: string
  description: string
  pubDate: Date
  author: string (default: 'Anonymous')
  image?: string
  tags: string[] (default: [])
  lang: 'de' | 'en'
  slug?: string
  lastUpdated?: Date
  draft?: boolean
}
```

**Location**: `src/content/blog/{de|en}/`

---

### 2. Team Collection

**Purpose**: Team member profiles showcasing the people behind Memoro.

**Schema**:
```typescript
{
  title: string
  description: string
  role: string
  image?: string
  social?: {
    linkedin?: string
    github?: string
    twitter?: string
  }
  lang: 'de' | 'en'
  category: 'kernteam' | 'freelance' | 'mentoren' | 'unterstuetzer' | 'alumni'
  order?: number
  categoryOrder?: number
  lastUpdated?: Date
}
```

**Location**: `src/content/team/{de|en}/`

**Categories**:
- `kernteam`: Core team members
- `freelance`: Freelance contributors
- `mentoren`: Mentors
- `unterstuetzer`: Supporters
- `alumni`: Former team members

---

### 3. Guide Collection

**Purpose**: Tutorials and how-to guides for using Memoro features.

**Schema**:
```typescript
{
  title: string
  description: string
  difficulty: 'beginner' | 'intermediate' | 'advanced'
  duration: string
  category: string
  author: string (default: 'Das Platform-Team')
  lastUpdated: Date
  lang: 'de' | 'en'
}
```

**Location**: `src/content/guides/{de|en}/`

---

### 4. Features Collection

**Purpose**: Detailed descriptions of Memoro's features and capabilities.

**Schema**:
```typescript
{
  title: string
  description: string
  lang: 'de' | 'en'
  icon: string
  color: 'blue' | 'red' | 'purple' | 'green' | 'orange'
  category?: 'organization' | 'language' | 'customization' | 'recording' | 
            'analytics' | 'collaboration' | 'ai-features' | 'sharing'
  order?: number
}
```

**Location**: `src/content/features/{de|en}/`

---

### 5. Legal Collection

**Purpose**: Legal documents including privacy policy, terms of service, etc.

**Schema**:
```typescript
{
  title: string
  lastUpdated?: Date
  lang: 'de' | 'en'
}
```

**Location**: `src/content/legal/`

---

### 6. Industry Collection

**Purpose**: Industry-specific use cases and solutions.

**Schema**:
```typescript
{
  title: string
  description: string
  icon: string
  color: 'blue' | 'red' | 'purple' | 'green'
  lang: 'de' | 'en'
  order?: number
  keyFeatures?: string[]
  testimonials?: Array<{
    quote: string
    author: string
    role: string
    company: string
  }>
}
```

**Location**: `src/content/industries/{de|en}/`

---

### 7. Testimonials Collection

**Purpose**: Customer testimonials and reviews organized by type.

**Schema**:
```typescript
{
  name: string
  role: string
  company?: string // Optional for private individuals
  image: string
  text: string
  lang: 'de' | 'en'
  type: 'private' | 'company' | 'network' | 'press'
  order?: number
  lastUpdated?: Date
  source?: string // For press: publication name
  sourceUrl?: string // For press: article link
}
```

**Location**: `src/content/testimonials/{de|en}/{type}/`

**Types**:
- `private`: Individual users
- `company`: Corporate testimonials
- `network`: Partner/network testimonials
- `press`: Press mentions and reviews

---

### 8. Pages Collection

**Purpose**: Structured content for special pages like pricing.

**Schema**:
```typescript
{
  title: string
  description: string
  lang: 'de' | 'en'
  type: string
  lastUpdated: Date
  sections: {
    hero: {
      title: string
      subtitle?: string
    }
    plans?: Array<{
      id?: string
      name: string
      price: {
        monthly: number
        yearly: number
      }
      priceUnit?: string
      yearlyBreakdown?: string
      features: string[]
      // Legacy fields
      minutes?: number
      memoLength?: number
      dailyMemos?: number | '∞'
      // Mana-based fields
      initialMana?: number
      dailyMana?: number
      maxMana?: number
      canGiftMana?: boolean
      cta: string
      highlight: boolean
    }>
    manaPotions?: {
      title: string
      subtitle: string
      items: Array<{
        id: string
        name: string
        manaAmount: number
        price: number
        popular: boolean
      }>
    }
    comparison?: { title: string }
    faq?: {
      title: string
      items: Array<{
        question: string
        answer: string
      }>
    }
    callToAction?: {
      title: string
      description: string
      buttonText: string
      buttonLink: string
    }
  }
}
```

**Location**: `src/content/pages/{de|en}/`

---

### 9. Contracts Collection

**Purpose**: Legal contracts and agreements available for download.

**Schema**:
```typescript
{
  title: string
  description: string
  lastUpdated: Date
  lang: 'de' | 'en'
  category: string
  order?: number
  downloadUrl?: string
  previewEnabled: boolean (default: false)
}
```

**Location**: `src/content/contracts/{de|en}/`

---

### 10. Blueprints Collection

**Purpose**: Pre-configured templates and setups for different use cases.

**Schema**:
```typescript
{
  title: string
  description: string
  icon: string
  color: 'blue' | 'red' | 'purple' | 'green' | 'orange' | 'yellow'
  lang: 'de' | 'en'
  order?: number
  lastUpdated?: Date
  isActive: boolean (default: true)
  features?: string[]
  compatibility?: string[]
}
```

**Location**: `src/content/blueprints/{de|en}/`

---

### 11. Memories Collection

**Purpose**: Memory templates and examples for different scenarios.

**Schema**:
```typescript
{
  title: string
  description: string
  icon: string
  color: 'blue' | 'red' | 'purple' | 'green' | 'orange' | 'yellow'
  category?: string
  lang: 'de' | 'en'
  order?: number
  lastUpdated?: Date
  isActive: boolean (default: true)
  features?: string[]
  compatibility?: string[]
}
```

**Location**: `src/content/memories/{de|en}/`

---

### 12. Wallpaper Collection

**Purpose**: Downloadable wallpapers in various formats and resolutions.

**Schema**:
```typescript
{
  title: string
  description: string
  thumbnail: string
  formats: Array<{
    type: 'desktop' | 'mobile' | 'tablet' | 'ultrawide'
    device?: string // e.g., "iPhone 16 Pro", "iPad Pro"
    resolution: string // "3840x2160"
    aspectRatio: string // "16:9"
    fileUrl: string // "/images/wallpaper/..."
    fileSize?: string // "2.4 MB"
  }>
  category: 'nature' | 'abstract' | 'city' | 'technology' | 'other'
  colors?: string[]
  tags?: string[]
  lang: 'de' | 'en'
  order?: number
  lastUpdated?: Date
  isActive: boolean (default: true)
  isFeatured: boolean (default: false)
  downloadCount: number (default: 0)
  formatDownloads?: Record<string, number>
}
```

**Location**: `src/content/wallpapers/{de|en}/`

---

### 13. FAQs Collection

**Purpose**: Frequently asked questions organized by category.

**Schema**:
```typescript
{
  question: string
  answer: string
  category: 'general' | 'features' | 'technical' | 'pricing' | 
           'security' | 'business' | 'industries' | 'guides'
  tags?: string[]
  order: number (default: 0)
  featured: boolean (default: false)
  relatedLinks?: Array<{
    title: string
    url: string
  }>
  lang: 'de' | 'en'
}
```

**Location**: `src/content/faqs/{de|en}/`

**Categories**:
- `general`: General questions
- `features`: Feature-related questions
- `technical`: Technical questions
- `pricing`: Pricing and plans
- `security`: Security and privacy
- `business`: Business and enterprise
- `industries`: Industry-specific questions
- `guides`: Tutorials and how-to questions

---

### 14. Statistics Collection

**Purpose**: Weekly and monthly reports with usage statistics and metrics.

**Schema**:
```typescript
{
  title: string
  description: string
  reportType: 'weekly' | 'monthly' (default: 'weekly')
  weekNumber?: number // Calendar week (for weekly reports)
  month?: number // Month (for monthly reports)
  year: number
  period: {
    start: Date
    end: Date
  }
  stats: {
    totalUsers: number
    newUsers: number
    activeUsers: number
    totalRecordings: number
    totalMinutes: number
    totalWords?: number
    totalEntries?: number
    manaConsumed: number
    manaPurchased: number
  }
  highlights?: string[] // Important events
  trends?: {
    userGrowth: number // Percentage compared to previous period
    recordingGrowth: number
    manaGrowth: number
  }
  topFeatures?: Array<{
    name: string
    usage: number
  }>
  lang: 'de' | 'en'
  publishDate: Date
  draft: boolean (default: false)
  author: string (default: 'Das Memoro Team')
}
```

**Location**: `src/content/statistics/{de|en}/`

---

### 15. Changelog Collection

**Purpose**: Product updates, release notes, and version history.

**Schema**:
```typescript
{
  title: string
  description: string
  version: string // e.g., "1.2.0"
  releaseDate: Date
  type: 'major' | 'minor' | 'patch' // Semantic versioning
  category: Array<'feature' | 'improvement' | 'bugfix' | 
                  'security' | 'performance' | 'other'>
  highlights?: string[] // Key features of this version
  breaking: boolean (default: false)
  deprecated?: string[] // Deprecated features
  migration?: string // Migration guide for breaking changes
  platforms?: Array<'web' | 'ios' | 'android' | 'api'>
  lang: 'de' | 'en'
  draft: boolean (default: false)
  author: string (default: 'Das Memoro Team')
}
```

**Location**: `src/content/changelog/{de|en}/`

**Categories**:
- `feature`: New features
- `improvement`: Improvements
- `bugfix`: Bug fixes
- `security`: Security updates
- `performance`: Performance improvements
- `other`: Other changes

---

## Best Practices

1. **Internationalization**: Always create content in both German and English
2. **File Naming**: Use kebab-case for file names (e.g., `my-blog-post.mdx`)
3. **Frontmatter**: Ensure all required fields are filled according to the schema
4. **Images**: Store images in `/public/images/` organized by content type
5. **Draft Mode**: Use the `draft` field to hide content from production
6. **Ordering**: Use the `order` field to control display sequence
7. **Dates**: Use ISO date format (YYYY-MM-DD) for all date fields

## Content Organization

The content is organized following this structure:
```
src/content/
├── [collection-name]/
│   ├── de/           # German content
│   │   └── *.mdx     # Content files
│   └── en/           # English content
│       └── *.mdx     # Content files
└── config.ts         # Collection schemas
```

For testimonials, an additional level of organization by type is used:
```
src/content/testimonials/
├── de/
│   ├── private/
│   ├── company/
│   ├── network/
│   └── press/
└── en/
    ├── private/
    ├── company/
    ├── network/
    └── press/
```