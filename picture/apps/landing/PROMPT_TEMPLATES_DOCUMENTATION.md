# Prompt Templates Collection - Documentation

## Overview

The Prompt Templates collection provides a comprehensive system for managing and displaying reusable AI image generation prompt templates. Users can browse, filter, search, and use pre-built prompt templates to generate high-quality images faster.

## Collection Schema

Located in: `/apps/landing/src/content/config.ts`

### Core Fields

#### Required Fields
- **title** (string) - The name of the template
- **description** (string) - Brief description of what the template creates
- **icon** (string) - Emoji icon for visual identification
- **promptTemplate** (string) - The template string with `{variable}` placeholders
- **category** (enum) - Main category for organization
- **difficulty** (enum) - beginner, intermediate, or advanced
- **recommendedModel** (string) - Best AI model for this template

#### Template Variables
- **variables** (array) - List of variable definitions:
  - `name` - Variable identifier in the template
  - `description` - User-friendly label
  - `placeholder` - Example values separated by `/`
  - `required` - Whether the variable must be filled

#### Organization
- **category** - Main category (social-media, product-photography, character-design, etc.)
- **tags** - Array of searchable tags
- **difficulty** - Skill level required
- **subcategory** - Optional subcategory for finer organization

#### Recommendations
- **recommendedModel** - Primary AI model
- **alternativeModels** - Array of alternative models
- **recommendedSettings** - Object with:
  - `aspectRatio` - Optimal image dimensions
  - `steps` - Generation steps
  - `guidanceScale` - Prompt adherence
  - `negativePrompt` - What to avoid

#### Examples & Variations
- **exampleImages** - Array of example outputs:
  - `url` - Image path
  - `prompt` - Exact prompt used
  - `variables` - Values used (optional)
- **variations** - Alternative template versions:
  - `title` - Variation name
  - `prompt` - Modified template
  - `description` - What makes it different

#### Engagement Metrics
- **uses** (number) - Total usage count
- **likes** (number) - User likes
- **saves** (number) - Times saved
- **rating** (number, 0-5) - Average rating
- **successRate** (number, 0-100) - Success percentage

#### Status Flags
- **featured** (boolean) - Show in featured section
- **popular** (boolean) - Mark as popular
- **trending** (boolean) - Currently trending
- **premium** (boolean) - Requires premium access

#### Metadata
- **publishDate** (date) - First published
- **lastUpdated** (date) - Last modification
- **language** (string) - Content language (en, de, fr, etc.)

#### Content & Guidance
- **useCases** - Array of use case strings
- **idealFor** - Array of target audience strings
- **tips** - Array of helpful tips
- **commonMistakes** - Array of things to avoid
- **doAndDont** - Object with `do` and `dont` arrays
- **relatedTemplates** - Array of related template slugs
- **seoKeywords** - Array of SEO keywords

## File Structure

```
apps/landing/src/content/promptTemplates/
├── en/
│   ├── instagram-product-showcase.md
│   ├── logo-design-modern.md
│   ├── cinematic-portrait.md
│   ├── fantasy-landscape.md
│   ├── abstract-wallpaper.md
│   └── character-design-rpg.md
├── de/
│   └── ... (German versions)
└── fr/
    └── ... (French versions)
```

## Template Format Example

```markdown
---
title: "Product Photography for Instagram"
description: "Create stunning product shots optimized for Instagram"
icon: "📸"

promptTemplate: "Professional product photography of {product}, {style} style, {lighting} lighting, on {background}, {angle} angle, high detail, commercial quality"

variables:
  - name: "product"
    description: "The product to photograph"
    placeholder: "sneakers / watch / coffee mug"
    required: true
  - name: "style"
    description: "Photography style"
    placeholder: "minimalist / editorial / lifestyle"
    required: true

category: "product-photography"
tags:
  - "product"
  - "instagram"
  - "commercial"

difficulty: "beginner"
recommendedModel: "flux-1-1-pro"
alternativeModels:
  - "flux-dev"

recommendedSettings:
  aspectRatio: "1:1"
  steps: 2
  guidanceScale: 3.5

featured: true
popular: true
trending: false
premium: false

uses: 15234
likes: 3421
saves: 2876
rating: 4.8

publishDate: 2025-01-20T00:00:00Z
lastUpdated: 2025-01-20T00:00:00Z

successRate: 95
---

## Create Professional Product Shots

Your content here...
```

## Utility Functions

Located in: `/apps/landing/src/utils/promptTemplates.ts`

### Template Retrieval
- `getAllPromptTemplates()` - Get all templates, sorted by uses
- `getFeaturedTemplates(limit)` - Get featured templates
- `getPopularTemplates(limit)` - Get popular templates
- `getTrendingTemplates(limit)` - Get trending templates
- `getTemplateBySlug(slug)` - Get single template

### Filtering
- `getTemplatesByCategory(category)` - Filter by category
- `getTemplatesByDifficulty(difficulty)` - Filter by difficulty
- `getTemplatesByTag(tag)` - Filter by tag
- `getTemplatesByModel(model)` - Filter by AI model

### Search & Sort
- `searchTemplates(query)` - Full-text search
- `sortTemplates(templates, sortBy)` - Sort by various criteria
- `getMostUsedTemplates(limit)` - Top used templates
- `getHighestRatedTemplates(limit)` - Top rated templates
- `getMostSavedTemplates(limit)` - Most saved templates

### Analytics
- `getAllCategories()` - Get categories with counts and icons
- `getAllTags()` - Get tags with usage counts
- `getTemplateStats()` - Comprehensive statistics

### Template Manipulation
- `fillTemplate(template, variables)` - Replace {variables} with values
- `extractVariables(template)` - Get all {variables} from template
- `validateTemplateVariables(template, providedVariables)` - Validate inputs

### Related Content
- `getRelatedTemplates(currentTemplate, limit)` - Get related templates

### UI Helpers
- `formatCategoryName(category)` - Format for display
- `getDifficultyColor(difficulty)` - Get badge color

## Components

Located in: `/apps/landing/src/components/promptTemplates/`

### TemplateCard.astro
Reusable card component for displaying template summaries.

**Props:**
- `template` - PromptTemplateEntry
- `featured` - boolean (optional)
- `compact` - boolean (optional)

**Features:**
- Icon and title
- Difficulty badge
- Status badges (featured, popular, trending)
- Description
- Category and tags
- Engagement stats (likes, views, rating)
- Recommended model

### PromptBuilder.astro
Interactive form for building prompts from templates.

**Props:**
- `template` - PromptTemplateEntry

**Features:**
- Dynamic form fields based on template variables
- Real-time prompt generation
- Copy to clipboard functionality
- CTA to open in app
- Required field validation

### CategoryGrid.astro
Grid display of all categories.

**Props:**
- `categories` - Array of category objects
- `interactive` - boolean (enables click-to-filter)

**Features:**
- Icon and category name
- Template count
- Hover effects
- Interactive filtering (when enabled)

### TemplateFilters.astro
Filter and sort controls.

**Props:**
- `categories` - Array of categories
- `difficulties` - Array of difficulty levels
- `models` - Array of AI models
- `stats` - Statistics object

**Features:**
- Category filter dropdown
- Difficulty filter dropdown
- Model filter dropdown
- Sort options (popular, recent, rating, uses)
- Active filters display
- Custom events for filter changes

### FeaturedSection.astro
Section component for displaying featured templates.

**Props:**
- `templates` - Array of PromptTemplateEntry
- `title` - string (optional)
- `description` - string (optional)

**Features:**
- Responsive grid layout
- Uses TemplateCard components
- Customizable heading

## Pages

### Index Page
**Path:** `/apps/landing/src/pages/prompt-templates/index.astro`

**Sections:**
1. Hero with search and stats
2. Filter bar (sticky)
3. Featured templates section
4. All templates grid with filtering
5. Category browser
6. CTA section

**Features:**
- Real-time client-side filtering
- Search functionality
- Sort options
- Active filters display
- No results state
- Responsive grid layouts

### Detail Page
**Path:** `/apps/landing/src/pages/prompt-templates/[slug].astro`

**Sections:**
1. Hero with template info and stats
2. Two-column layout:
   - **Main Content:**
     - Interactive prompt builder
     - Example prompt
     - Markdown content
     - Use cases
     - Tips & best practices
     - Common mistakes
     - Template variations
   - **Sidebar:**
     - Recommended settings
     - Success rate
     - CTA button
     - Ideal for audience
     - Tags
     - Share buttons
3. Related templates section
4. CTA section

**Features:**
- Interactive prompt builder with live preview
- Copy to clipboard
- Breadcrumb navigation
- Related template suggestions
- Social sharing
- Responsive layout

## SEO & Best Practices

### Title Format
`{Template Title} - AI Prompt Template | Picture`

### Description Format
Keep under 160 characters, focus on benefits and use cases.

### URL Structure
`/prompt-templates` - Index page
`/prompt-templates/{slug}` - Detail page
`/prompt-templates?category={category}` - Category filter
`/prompt-templates?tag={tag}` - Tag filter

### Content Guidelines
1. **Title** - Clear, descriptive, 3-7 words
2. **Description** - One sentence benefit statement
3. **Icon** - Relevant emoji
4. **Variables** - 3-8 variables, clear placeholders
5. **Tags** - 3-6 relevant tags
6. **Tips** - 3-6 actionable tips
7. **Use Cases** - 3-6 specific scenarios

### Engagement Tips
- Set realistic success rates
- Use clear, specific placeholders
- Include example images when possible
- Link related templates
- Add variations for flexibility

## Naming Conventions

### File Names
Use kebab-case with descriptive names:
- `instagram-product-showcase.md`
- `character-design-rpg.md`
- `cinematic-portrait.md`

### Category Slugs
Use kebab-case:
- `product-photography`
- `character-design`
- `social-media`

### Variable Names
Use snake_case:
- `product_type`
- `lighting_style`
- `color_scheme`

## Adding New Templates

1. Create markdown file in appropriate language folder
2. Copy template structure from existing file
3. Fill in all required fields
4. Test the prompt template with various inputs
5. Add example outputs if available
6. Link related templates
7. Verify SEO fields are complete

## Integration with Main App

The prompt templates are designed to integrate with the main Picture app:

1. User browses/searches templates on landing site
2. User fills in variables using PromptBuilder
3. User clicks "Open Picture App" CTA
4. Prompt is copied to clipboard
5. User pastes into app to generate

Future enhancement: URL parameters to pass prompt directly to app.

## Performance Considerations

- All templates are static at build time
- Client-side filtering for instant results
- Images lazy-loaded
- Optimized collection queries
- Cached template statistics

## Localization

Templates support multiple languages:
- Each language has its own folder
- Translations should maintain same slug structure
- Variables can be localized
- Keep English as base language

## Analytics Tracking

Consider tracking:
- Template views
- Template uses (prompt generation)
- Copy to clipboard events
- CTA clicks to app
- Search queries
- Filter usage
- Sort preferences

## Future Enhancements

Potential improvements:
- User-submitted templates
- Template ratings/reviews
- Save to favorites
- Template collections
- A/B testing different prompts
- AI-powered template suggestions
- Community templates marketplace
