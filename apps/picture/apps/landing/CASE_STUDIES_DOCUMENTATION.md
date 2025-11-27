# Case Studies Collection Documentation

## Overview

The Case Studies collection showcases real customer success stories demonstrating how businesses use Picture AI to transform their creative workflows. Each case study follows a structured narrative format with quantifiable metrics and compelling testimonials.

## Collection Structure

**Collection Type:** `content` (Markdown files)
**Location:** `/src/content/caseStudies/`
**Schema:** Defined in `/src/content/config.ts`

## Directory Structure

```
src/content/caseStudies/
├── en/
│   ├── luxe-fashion-ecommerce.md
│   ├── bright-social-agency.md
│   └── techstart-saas.md
```

## Schema Fields

### Basic Information

- **title** (string, required) - Case study title
- **description** (string, required) - Short SEO description
- **coverImage** (string, required) - Main hero image URL
- **heroVideo** (string, optional) - Video URL if available

### Company Information

- **company.name** (string, required) - Company name
- **company.logo** (string, optional) - Company logo URL
- **company.website** (string, optional) - Company website
- **company.industry** (string, required) - Industry (e.g., "E-commerce", "Marketing Agency")
- **company.size** (enum, optional) - 'startup' | 'small' | 'medium' | 'enterprise'
- **company.location** (string, optional) - Location (e.g., "San Francisco, CA")

### Contact Person (Optional)

- **contact.name** (string)
- **contact.role** (string)
- **contact.avatar** (string, optional)
- **contact.quote** (string, optional) - Pull quote

### Classification

- **category** (enum, required) - 'ecommerce' | 'marketing' | 'design' | 'content-creation' | 'saas' | 'education' | 'enterprise' | 'startup' | 'other'
- **tags** (array of strings) - Keywords like ["product-photography", "social-media"]
- **language** (enum, required) - 'en' | 'de' | 'fr' | 'it' | 'es'

### Visibility

- **featured** (boolean) - Featured on homepage
- **trending** (boolean) - Trending badge

### The Story Structure

Each case study follows a four-part narrative:

1. **challenge** (string, required) - What problem did they face?
2. **solution** (string, required) - How did Picture solve it?
3. **implementation** (string, required) - How did they implement Picture?
4. **results** (string, required) - What results did they achieve?

### Key Metrics

**metrics** (array of objects, optional):

- **label** (string) - e.g., "Time Saved", "Cost Reduction"
- **value** (string) - e.g., "80%", "€2,000/month"
- **description** (string, optional) - Additional context
- **icon** (string, optional) - Emoji or icon

Example:

```yaml
metrics:
  - label: 'Cost Reduction'
    value: '90%'
    description: 'Saved €54,000 per year on photography'
    icon: '💰'
  - label: 'Images Generated'
    value: '10,000+'
    description: 'Professional product photos in first 6 months'
    icon: '📸'
```

### Features & Models Used

- **featuresUsed** (array) - Feature slugs they used
- **modelsUsed** (array) - Model slugs they used
- **useCases** (array) - Use case slugs

### Before & After (Optional)

```yaml
beforeAfter:
  before:
    description: 'Hiring photographers for every product'
    image: '/images/before.jpg'
    metrics:
      - '€5,000/month on photography'
      - '2 weeks per photo shoot'
  after:
    description: 'Generate unlimited product photos on-demand'
    image: '/images/after.jpg'
    metrics:
      - '€500/month for Picture Pro'
      - 'Minutes per image'
```

### Example Images

**exampleImages** (array of objects):

- **url** (string)
- **caption** (string, optional)
- **prompt** (string, optional)

### Timeline (Optional)

```yaml
timeline:
  - date: 'January 2025'
    milestone: 'Started using Picture'
  - date: 'March 2025'
    milestone: 'Scaled to 10,000 images'
```

### Key Takeaways

**keyTakeaways** (array of strings, required):

```yaml
keyTakeaways:
  - 'AI image generation reduced costs by 90%'
  - 'Team productivity increased 5x'
  - 'Able to test more product variations'
```

### Testimonial (Optional)

```yaml
testimonial:
  quote: 'Picture transformed how we create product photos'
  author: 'Sarah Chen'
  role: 'Creative Director'
```

### Technical Details (Optional)

```yaml
technicalDetails:
  integrations:
    - 'Shopify'
    - 'WordPress'
  workflow: 'Automated workflow description'
  team:
    size: 5
    roles:
      - 'Designer'
      - 'Marketer'
```

### Related Content

- **relatedCaseStudies** (array) - Other case study slugs
- **relatedTutorials** (array) - Tutorial slugs
- **relatedFeatures** (array) - Feature slugs

### SEO & Metadata

- **seoKeywords** (array) - Target keywords
- **ogImage** (string, optional) - Social share image
- **publishDate** (date, required)
- **lastUpdated** (date, required)
- **author** (string) - Defaults to "Picture Team"

### Stats & Engagement

- **views** (number) - Default: 0
- **likes** (number) - Default: 0

### Custom CTA (Optional)

```yaml
cta:
  text: 'Start Your Free Trial'
  url: '/signup'
```

## Example Case Study

```markdown
---
title: 'How Luxe Fashion Reduced Photography Costs by 90%'
description: 'Luxe Fashion e-commerce store saves €54,000/year on product photography using Picture AI'
coverImage: '/images/case-studies/luxe-fashion-hero.jpg'

company:
  name: 'Luxe Fashion'
  logo: '/images/logos/luxe-fashion.svg'
  website: 'https://luxefashion.example'
  industry: 'E-commerce Fashion'
  size: 'small'
  location: 'Berlin, Germany'

contact:
  name: 'Sarah Chen'
  role: 'Creative Director'
  avatar: '/images/people/sarah-chen.jpg'
  quote: 'Picture transformed our entire content creation workflow'

category: 'ecommerce'
tags:
  - 'product-photography'
  - 'e-commerce'
  - 'fashion'
featured: true
trending: false
language: 'en'

challenge: 'We were spending €5,000/month on professional photographers...'
solution: 'Picture AI enabled us to generate unlimited product photos...'
implementation: 'We integrated Picture into our Shopify workflow...'
results: 'In 6 months, we generated over 10,000 product images...'

metrics:
  - label: 'Cost Reduction'
    value: '90%'
    description: 'Saved €54,000 per year'
    icon: '💰'
  - label: 'Images Generated'
    value: '10,000+'
    description: 'Professional product photos'
    icon: '📸'
  - label: 'Time Saved'
    value: '20 hours/week'
    description: 'Team productivity boost'
    icon: '⏱️'

featuresUsed:
  - 'flux-pro'
  - 'batch-generation'
  - 'api-integration'
modelsUsed:
  - 'flux-1-1-pro'
  - 'flux-dev'

keyTakeaways:
  - 'AI image generation reduced costs by 90%'
  - 'Team can test more product variations'
  - 'Faster time-to-market for new products'

testimonial:
  quote: 'Picture transformed how we create product photos. What used to take weeks now takes minutes.'
  author: 'Sarah Chen'
  role: 'Creative Director'

publishDate: 2025-01-20T00:00:00Z
lastUpdated: 2025-01-20T00:00:00Z
---

## The Full Story

[Detailed case study content in markdown format...]
```

## Pages & Components

### Pages

1. **Index Page** - `/src/pages/case-studies/index.astro`
   - Lists all case studies
   - Featured stories section
   - Category filtering
   - Search and sort functionality

2. **Detail Page** - `/src/pages/case-studies/[slug].astro`
   - Individual case study page
   - Hero with company info
   - Metrics display
   - Structured narrative (Challenge → Solution → Implementation → Results)
   - Key takeaways
   - Testimonial
   - Related case studies

### Components

1. **CaseStudyCard.astro** - `/src/components/caseStudies/CaseStudyCard.astro`
   - Displays case study card
   - Shows cover image, company logo, metrics
   - Category badge and tags
   - View/like counts
   - Supports featured variant

2. **CaseStudyFilters.astro** - `/src/components/caseStudies/CaseStudyFilters.astro`
   - Search input
   - Sort dropdown (newest, popular, views, company)
   - Industry filter
   - Active filters display with clear all

## Utility Functions

Located in `/src/utils/caseStudies.ts`:

### Core Functions

- `getAllCaseStudies()` - Get all case studies
- `getFeaturedCaseStudies()` - Get featured case studies
- `getTrendingCaseStudies()` - Get trending case studies
- `getCaseStudyBySlug(slug)` - Get single case study

### Filtering Functions

- `getCaseStudiesByCategory(category)` - Filter by category
- `getCaseStudiesByIndustry(industry)` - Filter by industry
- `getCaseStudiesByCompanySize(size)` - Filter by company size
- `getCaseStudiesByTag(tag)` - Filter by tag

### Related Content

- `getRelatedCaseStudies(currentCaseStudy, limit)` - Get related case studies

### Stats & Analytics

- `getCaseStudyStats()` - Get overall statistics
- `getCaseStudyCategories()` - Get all categories with counts
- `getMostViewedCaseStudies(limit)` - Get most viewed
- `getMostLikedCaseStudies(limit)` - Get most liked

### Sorting Functions

- `sortCaseStudiesByDate(caseStudies, order)` - Sort by date
- `sortCaseStudiesByViews(caseStudies)` - Sort by views
- `sortCaseStudiesByLikes(caseStudies)` - Sort by likes

## Best Practices

### Writing Case Studies

1. **Focus on Results** - Quantify outcomes with specific metrics
2. **Tell a Story** - Follow the Challenge → Solution → Implementation → Results narrative
3. **Use Real Data** - Include actual metrics, testimonials, and company information
4. **Add Visuals** - Include cover image, company logo, and example images
5. **Optimize for SEO** - Use descriptive titles, meta descriptions, and keywords

### Content Guidelines

- **Challenge:** Describe the specific problem the customer faced
- **Solution:** Explain how Picture AI solved that problem
- **Implementation:** Detail how they integrated Picture into their workflow
- **Results:** Provide quantifiable outcomes and metrics

### Metrics Guidelines

- Use percentage improvements (e.g., "90% cost reduction")
- Include absolute numbers (e.g., "€54,000 saved per year")
- Show time savings (e.g., "20 hours/week")
- Quantify output (e.g., "10,000+ images generated")

### SEO Optimization

- **Title Format:** "How [Company] [Achieved Result] with Picture AI"
- **Description:** Include company name, industry, key metric
- **Keywords:** Industry, use case, specific features used
- **OG Image:** Custom social share image with key metric

## URL Structure

- Index: `/case-studies`
- Detail: `/case-studies/{slug}`
- Category Filter: `/case-studies?category={category}`

## File Naming Convention

Use kebab-case for file names:

- `company-name-brief-description.md`
- Example: `luxe-fashion-ecommerce.md`

## Adding New Case Studies

1. Create new markdown file in `/src/content/caseStudies/en/`
2. Use existing case study as template
3. Fill in all required fields
4. Add high-quality cover image
5. Include 3-4 key metrics
6. Write compelling challenge/solution/implementation/results sections
7. Add 3-5 key takeaways
8. Include customer testimonial if available

## Notes

- All dates should be in ISO 8601 format with 'Z' suffix (e.g., `2025-01-20T00:00:00Z`)
- The `slug` field is NOT included in frontmatter - it's auto-generated from the filename
- All case studies must have `language: "en"` in frontmatter
- The collection uses `type: 'content'` for full markdown support
- Cover images should be high-quality, minimum 1200x630px
- Metrics should be specific, quantifiable, and verifiable

## Related Collections

- **Features** - Link to features used in case studies
- **AI Models** - Reference specific models used
- **Tutorials** - Link to related tutorials
- **Use Cases** - Connect to broader use case content
