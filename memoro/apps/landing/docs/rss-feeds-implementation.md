# RSS Feeds Implementation Guide

## Overview

This document describes the RSS feed implementation for the Memoro website. RSS feeds have been created for all major content collections, providing syndication capabilities in both German and English languages.

## Available RSS Feeds

The following RSS feeds are available for each content collection:

| Collection | German Feed | English Feed |
|------------|-------------|--------------|
| Blog | `/de/blog/rss.xml` | `/en/blog/rss.xml` |
| Team | `/de/team/rss.xml` | `/en/team/rss.xml` |
| Guides | `/de/guides/rss.xml` | `/en/guides/rss.xml` |
| Features | `/de/features/rss.xml` | `/en/features/rss.xml` |
| Industries | `/de/industries/rss.xml` | `/en/industries/rss.xml` |
| Testimonials | `/de/testimonials/rss.xml` | `/en/testimonials/rss.xml` |
| Blueprints | `/de/blueprints/rss.xml` | `/en/blueprints/rss.xml` |
| Memories | `/de/memories/rss.xml` | `/en/memories/rss.xml` |
| Wallpapers | `/de/wallpapers/rss.xml` | `/en/wallpapers/rss.xml` |
| FAQs | `/de/faqs/rss.xml` | `/en/faqs/rss.xml` |
| Statistics | `/de/statistics/rss.xml` | `/en/statistics/rss.xml` |
| Changelog | `/de/changelog/rss.xml` | `/en/changelog/rss.xml` |

## Technical Implementation

### Technology Stack
- **RSS Generation**: `@astrojs/rss` package (v4.0.12)
- **Styling**: XSL stylesheet for browser presentation (`/public/rss/styles.xsl`)
- **Content Source**: Astro content collections

### File Structure
```
src/pages/
├── de/
│   ├── blog/rss.xml.js         # Blog RSS (German)
│   ├── team/rss.xml.js         # Team RSS (German)
│   ├── guides/rss.xml.js       # Guides RSS (German)
│   └── ...                     # Other collections
└── en/
    ├── blog/rss.xml.js         # Blog RSS (English)
    ├── team/rss.xml.js         # Team RSS (English)
    ├── guides/rss.xml.js       # Guides RSS (English)
    └── ...                     # Other collections
```

### Common Implementation Pattern

Each RSS feed follows a consistent pattern:

```javascript
import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';

export async function GET(context) {
  const items = await getCollection('collection-name');
  
  // Filter by language and status
  const filteredItems = items
    .filter(item => item.data.lang === 'de') // or 'en'
    .filter(item => !item.data.draft)        // if applicable
    .sort(/* appropriate sorting logic */);

  const feedUrl = new URL('/de/collection/rss.xml', context.site).href;

  return rss({
    title: 'Feed Title',
    description: 'Feed Description',
    site: context.site,
    items: filteredItems.map((item) => ({
      title: item.data.title,
      pubDate: item.data.dateField || new Date(),
      description: item.data.description,
      link: `/de/path/${item.slug}/`,
      author: `${item.data.author} <till.schneider@memoro.ai>`,
      // Additional fields as needed
    })),
    customData: `<language>de</language>
<atom:link href="${feedUrl}" rel="self" type="application/rss+xml" xmlns:atom="http://www.w3.org/2005/Atom" />`,
    stylesheet: '/rss/styles.xsl',
  });
}
```

## Content-Specific Implementations

### Collections with Date Fields

1. **Blog**: Uses `pubDate` field, excludes drafts
2. **Guides**: Uses `lastUpdated` field (required)
3. **Statistics**: Uses `publishDate`, excludes drafts
4. **Changelog**: Uses `releaseDate`, excludes drafts

### Collections with Order Fields

1. **Features**: Sorted by `order` field
2. **Industries**: Sorted by `order` field
3. **Team**: Sorted by `categoryOrder` then `order`
4. **Testimonials**: Sorted by `order` field

### Collections with Status Fields

1. **Blueprints**: Filters by `isActive` boolean
2. **Memories**: Filters by `isActive` boolean
3. **Wallpapers**: Filters by `isActive`, featured items first

### Special Sorting Logic

- **FAQs**: Featured items first, then by order
- **Wallpapers**: Featured items first, then by order
- **Team**: Category order first, then individual order

## RSS Feed Features

### Standard RSS Elements
- **title**: Item title
- **pubDate**: Publication date (uses appropriate date field or current date)
- **description**: Item description or summary
- **link**: Full URL to the content
- **author**: Author information (where available)
- **categories**: Tags or categories (where applicable)

### Custom Elements
- **language**: Embedded in customData for feed language identification
- **stylesheet**: XSL stylesheet for browser-friendly presentation

## Integration with Site

### Auto-Discovery
RSS feeds should be added to the HTML head for auto-discovery by feed readers. This is typically done in the `BaseHead.astro` component:

```html
<link rel="alternate" type="application/rss+xml" 
      title="Memoro Blog RSS" 
      href={`/${lang}/blog/rss.xml`} />
```

### Feed Validation
All RSS feeds follow the RSS 2.0 specification and include:
- Required channel elements (title, link, description)
- Valid item elements with proper author email format
- Proper date formatting
- Absolute URLs for links
- Self-referencing atom:link for feed discovery
- Valid email addresses in author fields (format: `Name <email@domain.com>`)

## Adding New RSS Feeds

To add an RSS feed for a new content collection:

1. Create the RSS generator file:
   ```
   src/pages/[lang]/[collection-name]/rss.xml.js
   ```

2. Import required dependencies:
   ```javascript
   import rss from '@astrojs/rss';
   import { getCollection } from 'astro:content';
   ```

3. Implement the GET function following the pattern above

4. Consider:
   - Appropriate filtering (language, draft status, active status)
   - Correct sorting logic
   - Meaningful title and description
   - Proper date field selection
   - Link structure matching your routing

5. Add auto-discovery link in site head if needed

## Maintenance Notes

- RSS feeds are generated at build time (static generation)
- Content updates require a rebuild to appear in feeds
- The XSL stylesheet (`/public/rss/styles.xsl`) provides consistent browser presentation
- All date fields default to current date if not available
- Links use absolute URLs constructed from the site URL

## Testing RSS Feeds

1. **Local Testing**:
   ```bash
   npm run build
   npm run preview
   ```
   Visit `http://localhost:4321/de/[feed-path]/rss.xml`

2. **Validation**:
   - Use online RSS validators
   - Check in multiple feed readers
   - Verify all links are absolute and working
   - Ensure dates are properly formatted

## Best Practices

1. Always filter by language to ensure language-specific feeds
2. Exclude draft or inactive content as appropriate
3. Use meaningful titles and descriptions in the target language
4. Maintain consistent sorting logic within each collection
5. Include relevant metadata (author, categories) where available
6. Test feeds after any schema changes to content collections