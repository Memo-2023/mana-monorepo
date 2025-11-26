# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Memoro is a multilingual marketing website built with Astro for an AI-powered conversation documentation and note-taking app. The site supports German (de) as default and English (en) locales.

## Build Commands

```bash
npm run dev      # Start development server (localhost:4321)
npm run build    # Build production site to ./dist/
npm run preview  # Preview production build locally
npm run astro check  # Type-check the project. IMPORTANT: Use this after every change!
```

## Architecture

### Tech Stack

- **Framework**: Astro 5.3.0 with static site generation
- **Styling**: Tailwind CSS
- **Content**: MDX support with content collections
- **TypeScript**: Strict mode enabled

### Project Structure

```
src/
├── components/     # Reusable Astro components
├── content/        # Content collections with Zod schemas
│   ├── blog/      # Blog posts (de/en subfolders)
│   ├── team/      # Team member profiles
│   ├── features/  # Feature descriptions
│   ├── guides/    # User guides and tutorials
│   └── ...        # Other collections (industries, testimonials, etc.)
├── i18n/          # Internationalization (ui.ts for translations)
├── layouts/       # Page layout templates
├── pages/         # Routes with [lang] dynamic routing
├── styles/        # Global CSS with Tailwind
└── utils/         # Utility functions
```

### Internationalization (i18n)

- **Default locale**: German (de)
- **Supported locales**: German (de), English (en)
- **Routing**: Prefix-based (e.g., /de/blog, /en/blog)
- **Middleware**: Automatically redirects to default locale if missing
- **Translations**: Centralized in `src/i18n/ui.ts`
- **Content**: Organized in language subfolders within collections

### Content Collections

All content uses Zod schemas for validation. Key collections:

- **blog**: Articles with metadata (title, description, pubDate, author, tags)
- **team**: Team profiles with roles and social links
- **features**: Product features with icons and categories
- **guides**: Tutorials with difficulty levels and duration
- **testimonials**: Customer testimonials
- **legal**: Legal pages (privacy, terms, etc.)

Each content type must include:

- `lang` field (either 'de' or 'en')
- Proper frontmatter matching the schema
- MDX content body

### Code Style Guidelines

#### Components

- Use PascalCase for component names (e.g., `BlogCard.astro`)
- Define Props interfaces at the top of component files
- Import order: external libraries first, then project files

#### TypeScript

- Always use Zod schemas for content validation
- Define interfaces for all component props
- Use strict type checking (enabled in tsconfig)

#### CSS

- Use Tailwind CSS utility classes
- Follow kebab-case for custom CSS classes
- Avoid inline styles

#### Error Handling

- Middleware handles 404s and missing locale redirects
- Use optional chaining for potentially undefined values
- Provide fallbacks for missing translations

### Important Implementation Notes

- Static site generation means no server-side runtime
- All content is pre-built at build time
- Dynamic routes use Astro's `getStaticPaths()`
- Sitemap generation includes all locales
- Images stored in `/public/images/` organized by type

### Testing

No test framework is currently configured. Consider manual testing of:

- All language routes
- Content collection validation
- Build process for production
- 404 handling and redirects
