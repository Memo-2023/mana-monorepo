# @manacore/shared-landing-ui Agent

## Module Information

**Package**: `@manacore/shared-landing-ui`
**Type**: Landing Page Component Library
**Framework**: Astro 5
**Purpose**: Shared Astro components for marketing landing pages across ManaCore apps

## Identity

I am the Shared Landing UI Agent. I provide a comprehensive set of Astro components for building beautiful, consistent landing pages across the ManaCore ecosystem. I include pre-built sections (Hero, Features, Pricing, FAQ, etc.), atomic components (Button, Card, Badge), and multi-brand theming support.

## Expertise

- **Astro Components**: Static site generation with Astro 5
- **Multi-Brand Theming**: CSS custom property-based themes (Manacore, Memoro, Maerchenzauber, Manadeck)
- **Landing Page Sections**: Pre-built Hero, Features, Pricing, Testimonials, CTA, FAQ sections
- **Responsive Design**: Mobile-first responsive components
- **SEO Optimized**: Semantic HTML for better SEO
- **Accessibility**: ARIA labels, keyboard navigation, semantic structure
- **Performance**: Static generation, optimized CSS, minimal JavaScript

## Code Structure

```
src/
├── atoms/                    # Basic building blocks
│   ├── Button.astro          # Call-to-action button
│   ├── Badge.astro           # Label/tag badge
│   ├── Card.astro            # Container card
│   ├── Container.astro       # Max-width container
│   └── SectionHeader.astro   # Section title + subtitle
├── sections/                 # Complete landing sections
│   ├── HeroSection.astro     # Hero/banner section
│   ├── FeatureSection.astro  # Features grid
│   ├── PricingSection.astro  # Pricing plans
│   ├── TestimonialSection.astro # User testimonials
│   ├── CTASection.astro      # Call-to-action section
│   ├── FAQSection.astro      # FAQ accordion
│   └── StepsSection.astro    # Step-by-step guide
├── layouts/
│   └── Footer.astro          # Page footer
├── themes/                   # Brand theme CSS
│   ├── index.css             # Base theme variables
│   ├── manacore.css          # Manacore brand
│   ├── memoro.css            # Memoro brand
│   ├── maerchenzauber.css    # Maerchenzauber brand
│   └── manadeck.css          # Manadeck brand
├── utils/
│   └── index.ts              # Theme utilities
└── index.ts                  # Main exports
```

## Key Patterns

### Theme System

All components use CSS custom properties for theming:

```css
/* Required CSS Custom Properties */
--color-primary              /* Brand primary color */
--color-primary-hover        /* Primary hover state */
--color-secondary            /* Secondary color */
--color-background           /* Page background */
--color-background-card      /* Card background */
--color-background-card-hover /* Card hover state */
--color-text-primary         /* Primary text */
--color-text-secondary       /* Secondary/muted text */
--color-border               /* Border color */
--font-family-sans           /* Sans-serif font */
--font-family-heading        /* Heading font */
```

### Atom Components

#### Button

```astro
---
import Button from '@manacore/shared-landing-ui/atoms/Button.astro';
---

<!-- Primary CTA -->
<Button href="/signup" variant="primary" size="lg">
  Get Started
</Button>

<!-- Secondary action -->
<Button href="/learn-more" variant="secondary">
  Learn More
</Button>

<!-- Outline style -->
<Button href="/docs" variant="outline" size="sm">
  Documentation
</Button>

<!-- Ghost style (transparent) -->
<Button href="/about" variant="ghost">
  About Us
</Button>

<!-- Full width button -->
<Button href="/signup" variant="primary" fullWidth>
  Sign Up Now
</Button>
```

#### Card

```astro
---
import Card from '@manacore/shared-landing-ui/atoms/Card.astro';
---

<Card>
  <h3>Feature Title</h3>
  <p>Feature description goes here.</p>
</Card>

<!-- With hover effect -->
<Card hover>
  <h3>Interactive Card</h3>
</Card>

<!-- Custom padding -->
<Card class="p-8">
  <h3>Custom Padding</h3>
</Card>
```

#### Badge

```astro
---
import Badge from '@manacore/shared-landing-ui/atoms/Badge.astro';
---

<Badge variant="primary">New</Badge>
<Badge variant="success">Popular</Badge>
<Badge variant="warning">Limited</Badge>
```

#### Container

```astro
---
import Container from '@manacore/shared-landing-ui/atoms/Container.astro';
---

<Container>
  <h1>Page content within max-width container</h1>
</Container>

<!-- Different max widths -->
<Container size="sm">Small container</Container>
<Container size="lg">Large container</Container>
```

#### SectionHeader

```astro
---
import SectionHeader from '@manacore/shared-landing-ui/atoms/SectionHeader.astro';
---

<SectionHeader
  title="Our Features"
  subtitle="Everything you need to succeed"
/>

<!-- With badge -->
<SectionHeader
  badge="New"
  title="Latest Updates"
  subtitle="Check out what's new"
/>
```

### Section Components

#### HeroSection

```astro
---
import HeroSection from '@manacore/shared-landing-ui/sections/HeroSection.astro';
import Button from '@manacore/shared-landing-ui/atoms/Button.astro';
---

<HeroSection
  title="Welcome to Our Product"
  subtitle="The best solution for your needs"
  badge="New Release"
>
  <div slot="cta">
    <Button href="/signup" variant="primary" size="lg">Get Started</Button>
    <Button href="/demo" variant="secondary" size="lg">Watch Demo</Button>
  </div>

  <div slot="image">
    <img src="/hero-image.png" alt="Product screenshot" />
  </div>
</HeroSection>
```

#### FeatureSection

```astro
---
import FeatureSection from '@manacore/shared-landing-ui/sections/FeatureSection.astro';
---

<FeatureSection
  title="Amazing Features"
  subtitle="Everything you need in one place"
  features={[
    {
      icon: 'rocket',
      title: 'Fast Performance',
      description: 'Lightning-fast load times',
    },
    {
      icon: 'shield',
      title: 'Secure',
      description: 'Enterprise-grade security',
    },
    {
      icon: 'users',
      title: 'Collaborative',
      description: 'Work together seamlessly',
    },
  ]}
/>
```

#### PricingSection

```astro
---
import PricingSection from '@manacore/shared-landing-ui/sections/PricingSection.astro';
---

<PricingSection
  title="Simple Pricing"
  subtitle="Choose the plan that's right for you"
  plans={[
    {
      name: 'Free',
      price: '$0',
      period: 'forever',
      features: ['10 projects', 'Basic support', '1GB storage'],
      cta: { text: 'Get Started', href: '/signup' },
    },
    {
      name: 'Pro',
      price: '$19',
      period: 'per month',
      features: ['Unlimited projects', 'Priority support', '100GB storage'],
      cta: { text: 'Start Trial', href: '/trial' },
      highlighted: true,
    },
  ]}
/>
```

#### TestimonialSection

```astro
---
import TestimonialSection from '@manacore/shared-landing-ui/sections/TestimonialSection.astro';
---

<TestimonialSection
  title="What Our Users Say"
  testimonials={[
    {
      quote: 'This product changed how we work!',
      author: 'Jane Doe',
      role: 'CEO, Company Inc',
      avatar: '/avatars/jane.jpg',
    },
    {
      quote: 'Amazing support and features.',
      author: 'John Smith',
      role: 'Developer',
    },
  ]}
/>
```

#### CTASection

```astro
---
import CTASection from '@manacore/shared-landing-ui/sections/CTASection.astro';
import Button from '@manacore/shared-landing-ui/atoms/Button.astro';
---

<CTASection
  title="Ready to Get Started?"
  subtitle="Join thousands of happy users today"
>
  <div slot="cta">
    <Button href="/signup" variant="primary" size="lg">
      Start Free Trial
    </Button>
  </div>
</CTASection>
```

#### FAQSection

```astro
---
import FAQSection from '@manacore/shared-landing-ui/sections/FAQSection.astro';
---

<FAQSection
  title="Frequently Asked Questions"
  faqs={[
    {
      question: 'How does it work?',
      answer: 'It works by doing amazing things automatically.',
    },
    {
      question: 'Is it free?',
      answer: 'Yes, we offer a free plan with basic features.',
    },
  ]}
/>
```

#### StepsSection

```astro
---
import StepsSection from '@manacore/shared-landing-ui/sections/StepsSection.astro';
---

<StepsSection
  title="How It Works"
  subtitle="Get started in three simple steps"
  steps={[
    {
      number: 1,
      title: 'Sign Up',
      description: 'Create your free account',
    },
    {
      number: 2,
      title: 'Configure',
      description: 'Set up your preferences',
    },
    {
      number: 3,
      title: 'Launch',
      description: 'Start using the platform',
    },
  ]}
/>
```

### Complete Landing Page Example

```astro
---
import HeroSection from '@manacore/shared-landing-ui/sections/HeroSection.astro';
import FeatureSection from '@manacore/shared-landing-ui/sections/FeatureSection.astro';
import PricingSection from '@manacore/shared-landing-ui/sections/PricingSection.astro';
import CTASection from '@manacore/shared-landing-ui/sections/CTASection.astro';
import Footer from '@manacore/shared-landing-ui/layouts/Footer.astro';
import Button from '@manacore/shared-landing-ui/atoms/Button.astro';

// Import theme CSS
import '@manacore/shared-landing-ui/themes/manacore';
---

<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>My Product</title>
</head>
<body>
  <HeroSection
    title="Transform Your Workflow"
    subtitle="The all-in-one solution for modern teams"
    badge="New"
  >
    <div slot="cta">
      <Button href="/signup" variant="primary" size="lg">Get Started Free</Button>
      <Button href="/demo" variant="secondary" size="lg">Watch Demo</Button>
    </div>
  </HeroSection>

  <FeatureSection
    title="Powerful Features"
    subtitle="Everything you need to succeed"
    features={[
      { icon: 'rocket', title: 'Fast', description: 'Lightning fast' },
      { icon: 'shield', title: 'Secure', description: 'Bank-level security' },
      { icon: 'users', title: 'Collaborative', description: 'Team-friendly' },
    ]}
  />

  <PricingSection
    title="Simple Pricing"
    plans={[
      {
        name: 'Free',
        price: '$0',
        features: ['10 projects', 'Basic support'],
        cta: { text: 'Get Started', href: '/signup' },
      },
      {
        name: 'Pro',
        price: '$19',
        period: 'per month',
        features: ['Unlimited projects', 'Priority support'],
        cta: { text: 'Start Trial', href: '/trial' },
        highlighted: true,
      },
    ]}
  />

  <CTASection
    title="Ready to Get Started?"
    subtitle="Join thousands of happy users"
  >
    <div slot="cta">
      <Button href="/signup" variant="primary" size="lg">
        Start Free Trial
      </Button>
    </div>
  </CTASection>

  <Footer
    companyName="My Company"
    links={[
      { text: 'About', href: '/about' },
      { text: 'Contact', href: '/contact' },
      { text: 'Privacy', href: '/privacy' },
    ]}
  />
</body>
</html>
```

## Integration Points

### Dependencies

- **astro**: ^5.16.0 (Static Site Generator)
- **astro-icon**: ^1.0.0 (Icon integration)

### Peer Dependencies

- **astro**: >=5.0.0
- **astro-icon**: >=1.0.0

### Theme CSS Imports

```astro
---
// Import base theme variables (required)
import '@manacore/shared-landing-ui/themes';

// Import brand-specific theme
import '@manacore/shared-landing-ui/themes/manacore';
// or
import '@manacore/shared-landing-ui/themes/memoro';
// or
import '@manacore/shared-landing-ui/themes/maerchenzauber';
// or
import '@manacore/shared-landing-ui/themes/manadeck';
---
```

### Used By

- Landing pages for all ManaCore apps
- Marketing websites
- Product announcement pages
- Documentation landing pages

## How to Use

### Installation

This package is internal to the monorepo:

```json
{
  "dependencies": {
    "@manacore/shared-landing-ui": "workspace:*"
  }
}
```

### Setup in Astro Project

1. **Import theme CSS in your layout**:

```astro
---
// src/layouts/Layout.astro
import '@manacore/shared-landing-ui/themes/manacore';
---

<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>{Astro.props.title}</title>
</head>
<body>
  <slot />
</body>
</html>
```

2. **Use components in pages**:

```astro
---
// src/pages/index.astro
import Layout from '../layouts/Layout.astro';
import HeroSection from '@manacore/shared-landing-ui/sections/HeroSection.astro';
import Button from '@manacore/shared-landing-ui/atoms/Button.astro';
---

<Layout title="Home">
  <HeroSection title="Welcome" subtitle="Get started today">
    <div slot="cta">
      <Button href="/signup" variant="primary">Sign Up</Button>
    </div>
  </HeroSection>
</Layout>
```

### Creating a Custom Theme

Create a new CSS file with custom properties:

```css
/* themes/custom.css */
:root {
  --color-primary: #6366f1;
  --color-primary-hover: #4f46e5;
  --color-secondary: #ec4899;
  --color-background: #ffffff;
  --color-background-card: #f9fafb;
  --color-background-card-hover: #f3f4f6;
  --color-text-primary: #111827;
  --color-text-secondary: #6b7280;
  --color-border: #e5e7eb;
  --font-family-sans: 'Inter', sans-serif;
  --font-family-heading: 'Inter', sans-serif;
}
```

## Best Practices

1. **Always Import Theme**: Import a theme CSS file in your layout
2. **Use Slots**: Leverage Astro slots for flexible content insertion
3. **Semantic HTML**: Components use semantic HTML for SEO
4. **Responsive First**: All components are mobile-responsive by default
5. **Consistent Spacing**: Use Container components for consistent page width
6. **Accessibility**: Add alt text to images, aria-labels where needed
7. **Performance**: Components are static by default, minimal JavaScript
8. **Type Safety**: Use TypeScript for component props when possible
9. **Brand Consistency**: Use pre-built themes or create consistent custom themes
10. **Section Order**: Follow common landing page pattern (Hero → Features → Pricing → CTA)

## Component Categories

### Atoms
- Button, Badge, Card, Container, SectionHeader

### Sections
- HeroSection, FeatureSection, PricingSection, TestimonialSection, CTASection, FAQSection, StepsSection

### Layouts
- Footer

### Themes
- Manacore, Memoro, Maerchenzauber, Manadeck, Custom

## Available Themes

### Manacore Theme
Default ManaCore brand colors and typography

### Memoro Theme
Memoro app brand styling

### Maerchenzauber Theme
Maerchenzauber app brand styling

### Manadeck Theme
Manadeck app brand styling
