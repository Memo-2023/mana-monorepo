# Gallery Collection - Complete Implementation Guide

## Overview

The Gallery Collection displays AI-generated images from Picture's showcase. It's designed to inspire users, demonstrate model capabilities, and provide prompt examples.

## Collection Structure

### Schema Location
`src/content/config.ts` - `galleryCollection`

### Type
`type: 'data'` - Gallery entries are JSON/YAML data files (not markdown)

### Content Location
`src/content/gallery/*.json`

## Schema Fields

### Basic Information
- `title` (string, required) - Image title
- `slug` (string, required) - URL-friendly identifier
- `imageUrl` (string, required) - Path to image file
- `description` (string, optional) - SEO description

### Generation Details
- `prompt` (string, required) - The prompt used
- `negativePrompt` (string, optional) - Negative prompt if used
- `model` (string, required) - Model slug (e.g., "flux-dev")

### Generation Settings (optional object)
- `seed` (number)
- `steps` (number)
- `guidanceScale` (number)
- `width` (number)
- `height` (number)
- `aspectRatio` (string)

### Categorization
- `category` (enum, required) - One of: `portrait`, `landscape`, `abstract`, `illustration`, `photography`, `product`, `architecture`, `character`, `concept-art`, `other`
- `style` (string[], default: []) - Style tags like `["cinematic", "moody", "dark"]`
- `tags` (string[], default: []) - General tags

### Creator Info (optional object)
- `name` (string)
- `avatar` (string)
- `profileUrl` (string)

### Visibility & Status
- `featured` (boolean, default: false) - Show on homepage
- `trending` (boolean, default: false) - Trending badge
- `staffPick` (boolean, default: false) - Staff pick badge
- `published` (boolean, default: true) - Published or draft

### Engagement Metrics
- `likes` (number, default: 0)
- `downloads` (number, default: 0)
- `views` (number, default: 0)

### Quality & Moderation
- `qualityScore` (number, 1-5, optional) - Quality rating
- `nsfw` (boolean, default: false) - NSFW flag
- `moderationStatus` (enum, default: "approved") - `approved`, `pending`, `rejected`

### Related Content
- `relatedImages` (string[], default: []) - Related image slugs
- `relatedTutorials` (string[], default: []) - Tutorial slugs
- `relatedModels` (string[], default: []) - Model slugs

### SEO
- `seoKeywords` (string[], default: [])

### Metadata
- `createdAt` (date, required)
- `updatedAt` (date, optional)
- `language` (enum, default: "en") - `en`, `de`, `fr`, `it`, `es`

### Technical Metadata (optional)
- `fileSize` (number) - File size in bytes
- `dimensions` (object) - `{ width: number, height: number }`

## Example Entry

```json
{
  "title": "Cinematic Portrait in Golden Hour",
  "slug": "cinematic-portrait-golden-hour",
  "imageUrl": "/gallery/cinematic-portrait.jpg",
  "prompt": "Cinematic portrait of a woman in golden hour light, shallow depth of field, professional photography",
  "negativePrompt": "cartoon, illustration, oversaturated",
  "model": "flux-1-1-pro",
  "settings": {
    "seed": 42,
    "steps": 1,
    "guidanceScale": 3.5,
    "width": 1024,
    "height": 1440,
    "aspectRatio": "5:7"
  },
  "category": "portrait",
  "style": ["cinematic", "moody", "warm"],
  "tags": ["portrait", "golden-hour", "photography"],
  "creator": {
    "name": "Picture Gallery"
  },
  "featured": true,
  "trending": true,
  "staffPick": true,
  "published": true,
  "likes": 1247,
  "downloads": 389,
  "views": 5623,
  "qualityScore": 5,
  "nsfw": false,
  "moderationStatus": "approved",
  "relatedImages": ["professional-headshot", "sunset-portrait"],
  "relatedTutorials": ["advanced-prompt-engineering"],
  "relatedModels": ["flux-1-1-pro"],
  "description": "A stunning cinematic portrait showcasing FLUX 1.1 Pro.",
  "seoKeywords": ["cinematic portrait", "AI portrait"],
  "createdAt": "2025-01-15T10:00:00.000Z",
  "language": "en",
  "fileSize": 2456789,
  "dimensions": {
    "width": 1024,
    "height": 1440
  }
}
```

## Utility Functions

Location: `src/utils/gallery.ts`

### Fetching Images

```typescript
// All images
const images = await getAllGalleryImages();

// By language
const images = await getGalleryImagesByLanguage('en');

// Featured images
const featured = await getFeaturedGalleryImages();

// Trending images
const trending = await getTrendingGalleryImages();

// Staff picks
const staffPicks = await getStaffPickGalleryImages();

// By category
const portraits = await getGalleryImagesByCategory('portrait');

// By model
const fluxImages = await getGalleryImagesByModel('flux-dev');

// By style tag
const cinematic = await getGalleryImagesByStyle('cinematic');

// By tag
const landscapes = await getGalleryImagesByTag('landscape');
```

### Sorting & Filtering

```typescript
// Most liked
const mostLiked = await getMostLikedGalleryImages(12);

// Most downloaded
const mostDownloaded = await getMostDownloadedGalleryImages(12);

// Most viewed
const mostViewed = await getMostViewedGalleryImages(12);

// Recent images
const recent = await getRecentGalleryImages(12);

// Search
const results = await searchGalleryImages('fantasy landscape');

// Single image
const image = await getGalleryImageBySlug('cinematic-portrait-golden-hour');
```

### Related Content

```typescript
// Get related images (by category, model, style, tags)
const related = await getRelatedGalleryImages(currentImage, 6);
```

### Statistics & Aggregations

```typescript
// Categories with counts
const categories = await getGalleryCategories();
// => [{ category: 'portrait', count: 15 }, ...]

// Style tags with counts
const styles = await getGalleryStyles();
// => [{ style: 'cinematic', count: 8 }, ...]

// Tags with counts
const tags = await getGalleryTags();
// => [{ tag: 'landscape', count: 12 }, ...]

// Overall stats
const stats = await getGalleryStats();
// => { totalImages, totalLikes, totalDownloads, totalViews, averageLikes, ... }
```

### Helper Functions

```typescript
// Format file size
formatFileSize(2456789); // => "2.3 MB"

// Get aspect ratio display name
getAspectRatioDisplay("16:9"); // => "Landscape"
```

## Pages

### Index Page
**Location:** `src/pages/gallery/index.astro`

**Features:**
- Hero section with stats
- Featured images section
- Trending images section
- Staff picks section
- All images with filters
- CTA section

**URL:** `/gallery`

### Detail Page
**Location:** `src/pages/gallery/[slug].astro`

**Features:**
- Full image display
- Engagement bar (likes, views, downloads)
- Creator information
- Prompt display with copy functionality
- Generation settings
- Model information
- Tags and categories
- Related images
- Action buttons (Try This Prompt, Share)

**URL:** `/gallery/[slug]`

## Components

### GalleryCard
**Location:** `src/components/gallery/GalleryCard.astro`

**Props:**
- `image` (CollectionEntry<'gallery'>) - The gallery image
- `showStats` (boolean, default: true) - Show engagement stats

**Features:**
- Image with hover overlay showing prompt
- Badges (featured, trending, staff pick)
- Quality score
- Model badge
- Category badge
- Engagement stats
- Creator info

### GalleryFilters
**Location:** `src/components/gallery/GalleryFilters.astro`

**Props:**
- `categories` ({ category: string, count: number }[]) - Available categories

**Features:**
- Search input
- Category filter buttons
- Sort dropdown (likes, views, downloads, recent, quality)
- View toggle (grid/list)
- Interactive filtering with JavaScript

### GalleryGrid
**Location:** `src/components/gallery/GalleryGrid.astro`

**Props:**
- `images` (CollectionEntry<'gallery'>[]) - Images to display
- `columns` (2 | 3 | 4, default: 4) - Number of columns
- `showStats` (boolean, default: true) - Show stats on cards

**Features:**
- Responsive grid layout
- Empty state when no images

## Usage Examples

### Homepage - Featured Gallery

```astro
---
import { getFeaturedGalleryImages } from '../utils/gallery';
import GalleryCard from '../components/gallery/GalleryCard.astro';

const featured = await getFeaturedGalleryImages();
---

<section>
  <h2>Featured Gallery</h2>
  <div class="grid grid-cols-4 gap-6">
    {featured.map(image => <GalleryCard image={image} />)}
  </div>
</section>
```

### Model Page - Example Images

```astro
---
import { getGalleryImagesByModel } from '../utils/gallery';

const modelImages = await getGalleryImagesByModel('flux-1-1-pro');
---

<section>
  <h2>Example Images</h2>
  <div class="grid grid-cols-3 gap-4">
    {modelImages.slice(0, 6).map(image => (
      <GalleryCard image={image} showStats={false} />
    ))}
  </div>
</section>
```

## Best Practices

### Image Guidelines
1. **Quality First** - Only showcase high-quality generations
2. **Diverse Content** - Show variety of styles, categories, and models
3. **Real Prompts** - Use actual prompts that work well
4. **Accurate Settings** - Include working generation settings

### SEO Optimization
1. **Descriptive Titles** - Clear, searchable titles
2. **Keywords** - Include relevant keywords in description and tags
3. **Alt Text** - Image title serves as alt text
4. **Structured Data** - Schema is ready for structured data implementation

### Content Moderation
1. **NSFW Filtering** - Use `nsfw` flag and `moderationStatus`
2. **Quality Control** - Use `qualityScore` to curate best content
3. **Staff Picks** - Highlight exceptional examples

### Performance
1. **Lazy Loading** - Images use `loading="lazy"`
2. **Optimized Images** - Store multiple sizes if needed
3. **CDN** - Consider CDN for image delivery

## Multi-Language Support

Add language-specific entries:

```json
{
  "title": "Porträt in goldenem Licht",
  "slug": "portraet-goldenes-licht",
  "language": "de",
  ...
}
```

Filter by language:
```typescript
const germanImages = await getGalleryImagesByLanguage('de');
```

## Integration with Other Collections

### Link to AI Models
```astro
<a href={`/ai-models/${image.data.model}`}>View Model</a>
```

### Link to Tutorials
```astro
{image.data.relatedTutorials.map(slug => (
  <a href={`/tutorials/${slug}`}>View Tutorial</a>
))}
```

## Future Enhancements

1. **User Submissions** - Allow users to submit their creations
2. **Collections/Albums** - Group images into themed collections
3. **Image Editor Integration** - "Edit This Image" button
4. **Prompt Variations** - Show variations of same prompt
5. **Download Sizes** - Offer multiple download sizes
6. **Social Sharing** - Share to social media
7. **Favorites** - User favorites/bookmarks
8. **Real-time Stats** - Live engagement metrics
9. **Advanced Search** - Faceted search with multiple filters
10. **Lightbox Modal** - Full-screen image viewer

## Troubleshooting

### Images not appearing
- Check `published: true`
- Verify `imageUrl` path is correct
- Ensure image files exist in public folder

### Filters not working
- Check JavaScript is enabled
- Verify `data-category` attributes on cards
- Check browser console for errors

### Related images not showing
- Verify slugs in `relatedImages` exist
- Check at least some images share category/model/tags

## Example Gallery Entries

See example files in `src/content/gallery/`:
- `cinematic-portrait.json` - Portrait example
- `fantasy-landscape.json` - Landscape example
- `logo-design.json` - Text rendering example
- `product-shot.json` - Product photography example
- `abstract-art.json` - Abstract art example
- `character-design.json` - Character concept art example

## Support

For questions or issues with the Gallery Collection:
1. Check this documentation
2. Review example entries
3. Check utility function implementations
4. Verify schema in `config.ts`
