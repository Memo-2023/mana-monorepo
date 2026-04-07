# @mana/shared-landing-ui

Shared Astro components for landing pages across the Mana monorepo.

## Installation

```bash
pnpm add @mana/shared-landing-ui
```

## Usage

Import components directly from their paths:

```astro
---
import Button from '@mana/shared-landing-ui/atoms/Button.astro';
import Card from '@mana/shared-landing-ui/atoms/Card.astro';
import HeroSection from '@mana/shared-landing-ui/sections/HeroSection.astro';
import FeatureSection from '@mana/shared-landing-ui/sections/FeatureSection.astro';
import FAQSection from '@mana/shared-landing-ui/sections/FAQSection.astro';
---
```

## Required CSS Variables

The components use CSS custom properties for theming. Define these in your project's global CSS:

```css
:root {
  /* Primary colors */
  --color-primary: #3b82f6;
  --color-primary-hover: #2563eb;
  --color-primary-glow: rgba(59, 130, 246, 0.3);

  /* Text colors */
  --color-text-primary: #f9fafb;
  --color-text-secondary: #d1d5db;
  --color-text-muted: #6b7280;

  /* Background colors */
  --color-background-page: #111827;
  --color-background-card: #1f2937;
  --color-background-card-hover: #374151;

  /* Border colors */
  --color-border: #374151;
  --color-border-hover: #4b5563;
}
```

## Components

### Atoms (Basic Building Blocks)

- **Button** - Versatile button/link component with variants (primary, secondary, outline, ghost)
- **Card** - Container component with variants (default, hover, glow, bordered)
- **Badge** - Small label component with color variants
- **Container** - Max-width wrapper with responsive padding
- **SectionHeader** - Consistent section title and subtitle

### Sections (Page Sections)

- **HeroSection** - Hero area with title, subtitle, CTAs, and optional image
- **FeatureSection** - Feature grid with icons and descriptions
- **FAQSection** - Expandable FAQ accordion
- **TestimonialSection** - Customer testimonials grid
- **CTASection** - Call-to-action section
- **PricingSection** - Pricing plans comparison

### Layouts

- **Footer** - Configurable footer with sections, social links, and CTAs

## Examples

### Hero Section

```astro
<HeroSection
  title="Welcome to Our App"
  subtitle="The best solution for your needs"
  variant="default"
  image={{
    src: "/hero-image.jpg",
    alt: "Hero image",
    position: "right"
  }}
  primaryCta={{
    text: "Get Started",
    href: "/signup"
  }}
  secondaryCta={{
    text: "Learn More",
    href: "#features",
    variant: "secondary"
  }}
  trustBadges={[
    { icon: "✓", text: "Free Trial" },
    { icon: "🔒", text: "Secure" }
  ]}
/>
```

### Feature Section

```astro
<FeatureSection
  id="features"
  title="Amazing Features"
  subtitle="Everything you need to succeed"
  columns={3}
  features={[
    {
      icon: "🚀",
      title: "Fast",
      description: "Lightning-fast performance"
    },
    {
      icon: "🔒",
      title: "Secure",
      description: "Enterprise-grade security"
    },
    {
      icon: "💡",
      title: "Smart",
      description: "AI-powered insights"
    }
  ]}
/>
```

### FAQ Section

```astro
<FAQSection
  title="Frequently Asked Questions"
  faqs={[
    {
      question: "How does it work?",
      answer: "It's simple! Just sign up and start using our platform."
    },
    {
      question: "Is there a free trial?",
      answer: "Yes, we offer a 14-day free trial with full features."
    }
  ]}
/>
```

## Customization

### Slots

Most section components support slots for additional customization:

```astro
<HeroSection title="..." subtitle="...">
  <Fragment slot="title">
    Custom <span class="text-gradient">Title</span>
  </Fragment>
  <Fragment slot="background">
    <div class="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-500 opacity-10" />
  </Fragment>
</HeroSection>
```

### Class Overrides

All components accept a `class` prop for additional styling:

```astro
<Button class="my-custom-class">Click me</Button>
```

## Pre-built Themes

Use one of the pre-built theme CSS files for quick setup:

```css
/* In your global CSS or layout */
@import '@mana/shared-landing-ui/themes/memoro';
/* OR */
@import '@mana/shared-landing-ui/themes/mana';
/* OR */
@import '@mana/shared-landing-ui/themes/maerchenzauber';
/* OR */
@import '@mana/shared-landing-ui/themes/cards';
```

Or import in your Astro layout:

```astro
---
import '@mana/shared-landing-ui/themes/memoro';
---
```

## Migration Guide

### Step 1: Add the package

```bash
# In your landing app directory
pnpm add @mana/shared-landing-ui
```

Or add to package.json:
```json
{
  "dependencies": {
    "@mana/shared-landing-ui": "workspace:*"
  }
}
```

### Step 2: Add CSS Variables

Either import a pre-built theme (see above) or add the CSS variables to your global styles:

```css
:root {
  --color-primary: #your-primary-color;
  --color-primary-hover: #your-primary-hover;
  --color-primary-glow: rgba(your-primary-rgb, 0.3);
  --color-text-primary: #text-color;
  --color-text-secondary: #secondary-text;
  --color-text-muted: #muted-text;
  --color-background-page: #page-bg;
  --color-background-card: #card-bg;
  --color-background-card-hover: #card-hover-bg;
  --color-border: #border-color;
  --color-border-hover: #border-hover;
}
```

### Step 3: Replace Components

Replace your existing components with shared ones:

**Before (custom component):**
```astro
---
import HeroSection from '../components/sections/Hero.astro';
---
<HeroSection />
```

**After (shared component):**
```astro
---
import HeroSection from '@mana/shared-landing-ui/sections/HeroSection.astro';
---
<HeroSection
  title="Your Title"
  subtitle="Your subtitle"
  primaryCta={{ text: "Get Started", href: "/start" }}
/>
```

### Step 4: Migrate Data

Move hardcoded content to props:

**Before:**
```astro
<!-- Features hardcoded in component -->
const features = [
  { icon: '🚀', title: 'Fast', description: '...' }
];
```

**After:**
```astro
---
// Data in page file
const features = [
  { icon: '🚀', title: 'Fast', description: '...' }
];
---
<FeatureSection features={features} title="Features" />
```

### Example Demo Pages

Check these demo pages for working examples:

- `maerchenzauber/apps/landing/src/pages/shared-demo.astro`
- `memoro/apps/landing/src/pages/de/shared-demo.astro`
- `mana/apps/landing/src/pages/de/shared-demo.astro`

## Development

```bash
# Type check
pnpm run type-check
```

## File Structure

```
src/
├── atoms/           # Basic UI components
│   ├── Button.astro
│   ├── Card.astro
│   ├── Badge.astro
│   ├── Container.astro
│   └── SectionHeader.astro
├── sections/        # Page sections
│   ├── HeroSection.astro
│   ├── FeatureSection.astro
│   ├── FAQSection.astro
│   ├── TestimonialSection.astro
│   ├── CTASection.astro
│   └── PricingSection.astro
├── layouts/
│   └── Footer.astro
├── themes/          # Pre-built CSS themes
│   ├── index.css    # Default theme
│   ├── memoro.css
│   ├── mana.css
│   ├── maerchenzauber.css
│   └── cards.css
└── utils/
    └── index.ts     # TypeScript types
```
