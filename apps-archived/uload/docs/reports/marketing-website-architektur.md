# Marketing Website Architektur & Multi-Page-Konzept für uLoad

## Executive Summary

Dieses Dokument beschreibt eine vollständige Marketing-Website-Architektur mit mehreren Seiten, A/B/C-Testing-Funktionalität und klarer Trennung zwischen Marketing- und Produktbereich. Der Fokus liegt auf Skalierbarkeit, Performance und Conversion-Optimierung.

## 1. Gesamtarchitektur

### 1.1 Website-Struktur Overview

```
uLoad Marketing Ecosystem
├── Marketing Website (ulo.ad)
│   ├── Homepage (A/B/C Testing)
│   ├── Landing Pages (Multiple Variants)
│   ├── Pricing
│   ├── Features
│   ├── Use Cases
│   ├── Resources
│   ├── Company
│   └── Legal
├── Application (app.ulo.ad oder ulo.ad/app)
│   ├── Dashboard
│   ├── Link Management
│   └── User Settings
└── Public Profiles (ulo.ad/p/*)
    └── User Profiles
```

### 1.2 Domain-Strategie

#### Option A: Subdomain-Trennung

```
Marketing: ulo.ad
App: app.ulo.ad
API: api.ulo.ad
Profiles: ulo.ad/p/*
Short Links: ulo.ad/* oder s.ulo.ad/*
```

#### Option B: Path-basierte Trennung (Empfohlen)

```
Marketing: ulo.ad
App: ulo.ad/app/*
API: ulo.ad/api/*
Profiles: ulo.ad/p/*
Short Links: ulo.ad/*
```

## 2. Seitenstruktur & Navigation

### 2.1 Haupt-Navigation

```yaml
Primary Navigation:
  Logo: uLoad

  Product:
    - Features
    - Use Cases
    - Integrations
    - API Documentation

  Solutions:
    - For Marketing Teams
    - For Agencies
    - For E-Commerce
    - For Events
    - For Restaurants

  Pricing: (Direct Link)

  Resources:
    - Blog
    - Help Center
    - API Docs
    - Case Studies
    - Webinars

  Company:
    - About Us
    - Careers
    - Press Kit
    - Contact

  CTA Buttons:
    - Login (Secondary)
    - Start Free Trial (Primary)
```

### 2.2 Vollständige Seitenübersicht

#### Marketing Pages

```
/                           # Homepage (A/B/C Testing)
/features                   # Alle Features
/features/analytics         # Feature Deep-Dive
/features/qr-codes
/features/custom-domains
/features/api

/pricing                    # Preisübersicht
/pricing/compare           # Plan-Vergleich
/pricing/calculator        # ROI-Rechner

/solutions                  # Übersicht
/solutions/marketing       # Branchenspezifisch
/solutions/agencies
/solutions/ecommerce
/solutions/events
/solutions/restaurants

/use-cases                  # Anwendungsfälle
/customers                  # Kundengeschichten
/case-studies/*            # Einzelne Case Studies

/resources                  # Resource Center
/blog                      # Blog Übersicht
/blog/*                    # Blog-Artikel
/help                      # Help Center
/api-docs                  # API Dokumentation
/guides                    # Anleitungen
/webinars                  # Webinar-Archiv
/templates                 # Link-Templates

/company                    # Über uns
/about                     # Company Story
/team                      # Team-Seite
/careers                   # Jobs
/press                     # Presse
/contact                   # Kontakt

/legal                     # Rechtliches
/privacy                   # Datenschutz
/terms                     # AGB
/imprint                   # Impressum
/cookies                   # Cookie-Richtlinie
/dpa                       # Auftragsverarbeitung
/security                  # Sicherheit
```

#### Landing Pages (A/B/C Testing)

```
/lp/short-links            # Generic Landing Page
/lp/qr-generator          # Feature-spezifisch
/lp/link-in-bio           # Use-Case spezifisch
/lp/campaign-tracking
/lp/event-links
/lp/menu-qr-codes

/compare/bitly             # Vergleichsseiten
/compare/tinyurl
/compare/rebrandly

/free-tools/qr            # Kostenlose Tools
/free-tools/link-checker
/free-tools/utm-builder

/promo/*                   # Kampagnen-LPs
/offer/*                   # Spezielle Angebote
/partner/*                 # Partner-LPs
```

## 3. A/B/C Testing Strategie

### 3.1 Testing-Framework

```typescript
// A/B/C Testing Service
interface TestVariant {
	id: string;
	name: string;
	weight: number; // Traffic-Anteil (0-100)
	active: boolean;
}

interface ABTest {
	id: string;
	page: string;
	variants: TestVariant[];
	metrics: string[];
	startDate: Date;
	endDate?: Date;
	winner?: string;
}

// Beispiel-Konfiguration
const homepageTest: ABTest = {
	id: 'homepage-hero-q1-2025',
	page: '/',
	variants: [
		{ id: 'control', name: 'Original', weight: 34, active: true },
		{ id: 'variant-a', name: 'Value Focus', weight: 33, active: true },
		{ id: 'variant-b', name: 'Social Proof', weight: 33, active: true }
	],
	metrics: ['conversion', 'bounce_rate', 'time_on_page'],
	startDate: new Date('2025-01-01')
};
```

### 3.2 Homepage Varianten

#### Variant A: Control (Original)

```yaml
Hero:
  Headline: 'Short Links That Work Harder'
  Subheadline: 'Professional URL management with analytics'
  CTA: 'Start Free Trial'
  Visual: Product Screenshot

Structure: 1. Hero Section
  2. Features Grid
  3. How It Works
  4. Testimonials
  5. Pricing Preview
  6. CTA Section
```

#### Variant B: Value-Focused

```yaml
Hero:
  Headline: 'Save 3 Hours Per Week on Link Management'
  Subheadline: 'Automate your URL workflow with smart tools'
  CTA: 'See How It Works'
  Visual: ROI Calculator

Structure: 1. Hero with Calculator
  2. Problem/Solution
  3. ROI Statistics
  4. Feature Benefits
  5. Case Study
  6. Pricing with Savings
```

#### Variant C: Social Proof Heavy

```yaml
Hero:
  Headline: 'Join 10,000+ Marketers Using uLoad'
  Subheadline: 'The URL shortener trusted by leading brands'
  CTA: 'Join Leading Brands'
  Visual: Customer Logos

Structure: 1. Hero with Logos
  2. Success Metrics
  3. Customer Stories
  4. Features as Benefits
  5. Reviews & Ratings
  6. Community CTA
```

### 3.3 Landing Page Varianten-System

```typescript
// Landing Page Template System
interface LandingPageTemplate {
	id: string;
	name: string;
	components: ComponentConfig[];
	variants: {
		headline: string[];
		cta: string[];
		layout: string[];
		color: string[];
	};
}

// Beispiel: QR-Code Landing Page
const qrLandingPage: LandingPageTemplate = {
	id: 'qr-generator-lp',
	name: 'QR Code Generator',
	components: [
		{ type: 'hero', variants: ['minimal', 'visual', 'interactive'] },
		{ type: 'demo', variants: ['embedded', 'modal', 'stepped'] },
		{ type: 'benefits', variants: ['grid', 'list', 'carousel'] },
		{ type: 'pricing', variants: ['simple', 'detailed', 'hidden'] }
	],
	variants: {
		headline: [
			'Create QR Codes in Seconds',
			'Free QR Code Generator for Your Business',
			'Professional QR Codes That Convert'
		],
		cta: ['Generate QR Code Now', 'Start Creating Free', 'Try It Now - No Sign Up'],
		layout: ['centered', 'split', 'full-width'],
		color: ['purple', 'blue', 'gradient']
	}
};
```

## 4. Detaillierte Seitenkonzepte

### 4.1 Homepage-Struktur

```yaml
Homepage Components:
  1. Navigation:
     - Sticky header
     - Mega menu for solutions
     - Search functionality
     - Language switcher

  2. Hero Section:
     - Dynamic headline (A/B tested)
     - Value proposition
     - Primary CTA
     - Trust indicators
     - Hero visual/video

  3. Features Section:
     - Bento grid layout
     - Interactive previews
     - Feature categories

  4. Social Proof:
     - Logo cloud
     - Success metrics
     - Testimonial carousel

  5. Use Cases:
     - Industry tabs
     - Visual examples
     - Success stories

  6. Interactive Demo:
     - Live URL shortener
     - QR preview
     - Analytics sample

  7. Pricing Teaser:
     - 3 main plans
     - "See all features" link
     - Special offer banner

  8. Resources:
     - Latest blog posts
     - Popular guides
     - Webinar announcements

  9. Footer:
     - Comprehensive sitemap
     - Newsletter signup
     - Social links
     - Legal links
```

### 4.2 Pricing Page Detail

```yaml
Pricing Page Structure:
  1. Header:
     - Clear value proposition
     - Monthly/Annual toggle
     - Currency selector
     - "Save 20%" badge

  2. Plans Grid:
     Free:
       - 100 links/month
       - Basic analytics
       - QR codes
       - Community support
       Price: €0

     Professional:
       - 10,000 links/month
       - Advanced analytics
       - Custom domains
       - API access
       - Priority support
       Price: €19/month

     Business:
       - Unlimited links
       - Team collaboration
       - White label
       - SLA guarantee
       - Dedicated support
       Price: €79/month

     Enterprise:
       - Custom limits
       - SSO/SAML
       - Custom integrations
       - Account manager
       Price: Custom

  3. Feature Comparison:
     - Detailed table
     - Collapsible categories
     - Tooltips for features

  4. ROI Calculator:
     - Time saved
     - Click value
     - ROI projection

  5. FAQs:
     - Billing questions
     - Feature questions
     - Migration help

  6. Trust Section:
     - Security badges
     - Compliance info
     - Money-back guarantee

  7. CTA:
     - Start free trial
     - Talk to sales
     - View demo
```

### 4.3 Features Pages

```yaml
Feature Page Template:
  URL: /features/[feature-name]

  Structure:
    1. Hero:
      - Feature title
      - Key benefit
      - Visual demo
      - Start using CTA

    2. Benefits Grid:
      - 3-4 key benefits
      - Icons and descriptions
      - Real-world examples

    3. How It Works:
      - Step-by-step guide
      - Video tutorial
      - Interactive demo

    4. Use Cases:
      - Industry examples
      - Success metrics
      - Customer quotes

    5. Integration:
      - API documentation
      - Zapier/Integromat
      - Webhooks

    6. Comparison:
      - vs. competitors
      - vs. manual process
      - Time/cost savings

    7. Related Features:
      - Cross-sell other features
      - Bundle suggestions

    8. CTA:
      - Try this feature
      - See pricing
      - Book demo
```

### 4.4 Legal Pages

```yaml
Privacy Policy:
  Sections:
    - Data collection
    - Data usage
    - Data sharing
    - Cookies
    - User rights
    - Data retention
    - Security measures
    - Contact information

  Features:
    - Table of contents
    - Last updated date
    - Version history
    - Print-friendly version
    - Multi-language

Terms of Service:
  Sections:
    - Service description
    - User obligations
    - Payment terms
    - Intellectual property
    - Limitations of liability
    - Termination
    - Dispute resolution
    - Changes to terms

Impressum:
  Required Info:
    - Company name
    - Legal form
    - Registration number
    - VAT ID
    - Address
    - Contact details
    - Managing directors
    - Responsible for content

Cookie Policy:
  Structure:
    - What are cookies
    - Types we use
    - Cookie list (table)
    - Managing preferences
    - Third-party cookies
    - Updates to policy
```

### 4.5 Contact Page

```yaml
Contact Page:
  Hero:
    - "We're Here to Help"
    - Response time indicator
    - Preferred contact methods

  Contact Options:
    Sales:
      - Form with qualification questions
      - Calendar booking widget
      - Phone number (business hours)
      - Expected response: 1 hour

    Support:
      - Help center link
      - Ticket system
      - Live chat widget
      - Expected response: 4 hours

    General:
      - Contact form
      - Email address
      - Expected response: 24 hours

    Press:
      - Press kit download
      - Media contact
      - Brand assets

  Additional Info:
    - Office locations (if any)
    - Business hours
    - Holiday schedule
    - Social media links
```

## 5. Technische Implementierung

### 5.1 Routing-Struktur

```typescript
// src/routes/ Struktur
src/routes/
├── (marketing)/                    # Marketing-Bereich
│   ├── +layout.svelte             # Marketing Layout
│   ├── +layout.server.ts          # A/B Test Logic
│   ├── +page.svelte               # Homepage
│   ├── +page.server.ts            # SEO & Prerender
│   ├── features/
│   │   ├── +page.svelte           # Features Übersicht
│   │   └── [slug]/                # Feature Details
│   │       └── +page.svelte
│   ├── pricing/
│   │   ├── +page.svelte
│   │   ├── compare/
│   │   └── calculator/
│   ├── solutions/
│   │   ├── +page.svelte
│   │   └── [industry]/
│   ├── lp/                        # Landing Pages
│   │   └── [campaign]/
│   │       ├── +page.svelte
│   │       └── +page.server.ts    # A/B Logic
│   ├── legal/
│   │   ├── privacy/
│   │   ├── terms/
│   │   ├── imprint/
│   │   └── cookies/
│   ├── company/
│   │   ├── about/
│   │   ├── team/
│   │   ├── careers/
│   │   └── press/
│   ├── resources/
│   │   ├── blog/
│   │   │   ├── +page.svelte
│   │   │   └── [slug]/
│   │   ├── guides/
│   │   └── api-docs/
│   └── contact/
│       └── +page.svelte
├── (app)/                          # Application
│   ├── +layout.svelte             # App Layout
│   ├── app/
│   │   ├── dashboard/
│   │   └── settings/
│   ├── login/
│   └── register/
├── (public)/                       # Public Profiles
│   └── p/
│       └── [username]/
├── (api)/                          # API Routes
│   └── api/
│       ├── v1/
│       └── webhooks/
└── [code]/                         # Short Links
    └── +page.server.ts            # Redirect Logic
```

### 5.2 A/B Testing Implementation

```typescript
// src/lib/ab-testing.ts
import { cookies } from '@sveltejs/kit';
import type { Cookies } from '@sveltejs/kit';

export interface ABTestConfig {
	id: string;
	variants: Variant[];
	metrics: string[];
	active: boolean;
}

export interface Variant {
	id: string;
	name: string;
	weight: number;
	component?: string;
	props?: Record<string, any>;
}

export class ABTestingService {
	private tests: Map<string, ABTestConfig> = new Map();

	constructor() {
		this.loadTests();
	}

	private loadTests() {
		// Load from configuration or database
		this.tests.set('homepage-hero', {
			id: 'homepage-hero',
			active: true,
			variants: [
				{ id: 'control', name: 'Control', weight: 34 },
				{ id: 'value', name: 'Value Focus', weight: 33 },
				{ id: 'social', name: 'Social Proof', weight: 33 }
			],
			metrics: ['conversion', 'bounce_rate', 'engagement']
		});
	}

	getVariant(testId: string, cookies: Cookies): Variant | null {
		const test = this.tests.get(testId);
		if (!test || !test.active) return null;

		// Check for existing assignment
		const cookieName = `ab_${testId}`;
		const existing = cookies.get(cookieName);

		if (existing) {
			return test.variants.find((v) => v.id === existing) || null;
		}

		// Assign new variant
		const variant = this.selectVariant(test.variants);
		cookies.set(cookieName, variant.id, {
			path: '/',
			maxAge: 60 * 60 * 24 * 30, // 30 days
			httpOnly: true,
			secure: true,
			sameSite: 'lax'
		});

		// Track assignment
		this.trackAssignment(testId, variant.id);

		return variant;
	}

	private selectVariant(variants: Variant[]): Variant {
		const total = variants.reduce((sum, v) => sum + v.weight, 0);
		let random = Math.random() * total;

		for (const variant of variants) {
			random -= variant.weight;
			if (random <= 0) return variant;
		}

		return variants[0];
	}

	private trackAssignment(testId: string, variantId: string) {
		// Send to analytics
		if (typeof window !== 'undefined') {
			window.gtag?.('event', 'ab_test_assignment', {
				test_id: testId,
				variant_id: variantId
			});
		}
	}

	trackConversion(testId: string, variantId: string, value?: number) {
		// Track conversion event
		if (typeof window !== 'undefined') {
			window.gtag?.('event', 'ab_test_conversion', {
				test_id: testId,
				variant_id: variantId,
				value: value || 1
			});
		}
	}
}

// Singleton instance
export const abTesting = new ABTestingService();
```

### 5.3 Layout für Marketing-Bereich

```svelte
<!-- src/routes/(marketing)/+layout.svelte -->
<script lang="ts">
  import { page } from '$app/stores';
  import MarketingNav from '$lib/components/marketing/MarketingNav.svelte';
  import MarketingFooter from '$lib/components/marketing/MarketingFooter.svelte';
  import CookieBanner from '$lib/components/CookieBanner.svelte';
  import ABTestProvider from '$lib/components/ABTestProvider.svelte';

  let { children, data } = $props();

  // Tracking
  $effect(() => {
    if (typeof window !== 'undefined') {
      window.gtag?.('config', 'GA_MEASUREMENT_ID', {
        page_path: $page.url.pathname
      });
    }
  });
</script>

<ABTestProvider variant={data.abVariant}>
  <MarketingNav />

  <main id="main-content">
    {@render children?.()}
  </main>

  <MarketingFooter />
  <CookieBanner />
</ABTestProvider>

<!-- Layout Server -->
<!-- src/routes/(marketing)/+layout.server.ts -->
<script lang="ts">
import type { LayoutServerLoad } from './$types';
import { abTesting } from '$lib/ab-testing';

export const load: LayoutServerLoad = async ({ cookies, url }) => {
  // Determine A/B test variants
  const variants: Record<string, any> = {};

  // Homepage test
  if (url.pathname === '/') {
    variants.homepage = abTesting.getVariant('homepage-hero', cookies);
  }

  // Landing page tests
  if (url.pathname.startsWith('/lp/')) {
    const campaign = url.pathname.split('/')[2];
    variants.landing = abTesting.getVariant(`lp-${campaign}`, cookies);
  }

  return {
    abVariant: variants
  };
};

// Enable prerendering for marketing pages
export const prerender = true;
export const trailingSlash = 'always';
</script>
```

### 5.4 Multi-Language Support

```typescript
// src/lib/i18n/config.ts
export const languages = {
	en: 'English',
	de: 'Deutsch',
	es: 'Español',
	fr: 'Français'
} as const;

export const defaultLanguage = 'en';

export type Language = keyof typeof languages;

// Language-specific routes
export const routes: Record<Language, Record<string, string>> = {
	en: {
		'/features': '/features',
		'/pricing': '/pricing',
		'/contact': '/contact'
	},
	de: {
		'/features': '/funktionen',
		'/pricing': '/preise',
		'/contact': '/kontakt'
	},
	es: {
		'/features': '/caracteristicas',
		'/pricing': '/precios',
		'/contact': '/contacto'
	},
	fr: {
		'/features': '/fonctionnalites',
		'/pricing': '/tarifs',
		'/contact': '/contact'
	}
};
```

## 6. Content Management

### 6.1 CMS Integration Options

#### Option A: Headless CMS (Strapi/Contentful)

```typescript
// src/lib/cms.ts
interface CMSAdapter {
	getPage(slug: string, locale: string): Promise<PageContent>;
	getBlogPosts(limit: number): Promise<BlogPost[]>;
	getTestimonials(): Promise<Testimonial[]>;
}

class StrapiAdapter implements CMSAdapter {
	async getPage(slug: string, locale: string) {
		const response = await fetch(
			`${STRAPI_URL}/api/pages?filters[slug][$eq]=${slug}&locale=${locale}`
		);
		return response.json();
	}

	async getBlogPosts(limit: number) {
		const response = await fetch(
			`${STRAPI_URL}/api/blog-posts?pagination[limit]=${limit}&sort=createdAt:desc`
		);
		return response.json();
	}

	async getTestimonials() {
		const response = await fetch(`${STRAPI_URL}/api/testimonials?filters[featured]=true`);
		return response.json();
	}
}
```

#### Option B: File-based Content (MDX)

```typescript
// src/lib/content.ts
import { compile } from '@mdx-js/mdx';
import matter from 'gray-matter';

export async function getMarkdownContent(filepath: string) {
	const file = await fs.readFile(filepath, 'utf-8');
	const { data, content } = matter(file);

	const compiled = await compile(content, {
		outputFormat: 'function-body'
	});

	return {
		metadata: data,
		content: compiled
	};
}

// Usage in route
// src/routes/(marketing)/blog/[slug]/+page.server.ts
export async function load({ params }) {
	const post = await getMarkdownContent(`./content/blog/${params.slug}.mdx`);

	return {
		post,
		seo: {
			title: post.metadata.title,
			description: post.metadata.excerpt,
			image: post.metadata.image
		}
	};
}
```

### 6.2 Dynamic Content Areas

```yaml
Dynamic Content Management:
  Homepage:
    - Hero headlines
    - Feature highlights
    - Testimonials
    - Blog posts (latest 3)
    - Success metrics

  Pricing:
    - Plan details
    - Feature lists
    - Promotional banners
    - FAQs

  Blog:
    - Articles
    - Categories
    - Authors
    - Related posts

  Legal:
    - Version control
    - Update notifications
    - Multi-language
```

## 7. Performance & SEO

### 7.1 Performance Optimierungen

```typescript
// svelte.config.js - Optimierungen
import adapter from '@sveltejs/adapter-node';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

export default {
	kit: {
		adapter: adapter(),
		prerender: {
			// Prerender marketing pages
			entries: [
				'/',
				'/features',
				'/pricing',
				'/solutions',
				'/company/about',
				'/legal/privacy',
				'/legal/terms',
				'/legal/imprint'
			],
			handleHttpError: ({ path, referrer, message }) => {
				// Handle 404s gracefully
				if (path.startsWith('/blog/') && message.includes('404')) {
					return; // Ignore, will be handled dynamically
				}
				throw new Error(message);
			}
		},
		csp: {
			directives: {
				'script-src': ['self', 'unsafe-inline', 'https://www.googletagmanager.com'],
				'style-src': ['self', 'unsafe-inline'],
				'img-src': ['self', 'data:', 'https:']
			}
		}
	}
};
```

### 7.2 SEO-Optimierung

```svelte
<!-- src/lib/components/SEO.svelte -->
<script lang="ts">
	import { page } from '$app/stores';

	interface Props {
		title?: string;
		description?: string;
		image?: string;
		type?: 'website' | 'article' | 'product';
		author?: string;
		publishedDate?: string;
		modifiedDate?: string;
		schema?: any;
	}

	let {
		title = 'uLoad - Professional URL Shortener',
		description = 'Create short, branded links with analytics',
		image = 'https://ulo.ad/og-default.png',
		type = 'website',
		author,
		publishedDate,
		modifiedDate,
		schema
	}: Props = $props();

	const url = $page.url.toString();
	const siteName = 'uLoad';
</script>

<svelte:head>
	<!-- Basic Meta -->
	<title>{title}</title>
	<meta name="description" content={description} />
	<link rel="canonical" href={url} />

	<!-- Open Graph -->
	<meta property="og:site_name" content={siteName} />
	<meta property="og:type" content={type} />
	<meta property="og:title" content={title} />
	<meta property="og:description" content={description} />
	<meta property="og:image" content={image} />
	<meta property="og:url" content={url} />

	<!-- Twitter -->
	<meta name="twitter:card" content="summary_large_image" />
	<meta name="twitter:site" content="@uload" />
	<meta name="twitter:title" content={title} />
	<meta name="twitter:description" content={description} />
	<meta name="twitter:image" content={image} />

	<!-- Article specific -->
	{#if type === 'article'}
		{#if author}<meta property="article:author" content={author} />{/if}
		{#if publishedDate}<meta property="article:published_time" content={publishedDate} />{/if}
		{#if modifiedDate}<meta property="article:modified_time" content={modifiedDate} />{/if}
	{/if}

	<!-- Schema.org -->
	{#if schema}
		<script type="application/ld+json">
      {JSON.stringify(schema)}
		</script>
	{/if}
</svelte:head>
```

## 8. Analytics & Tracking

### 8.1 Event Tracking Strategie

```typescript
// src/lib/analytics.ts
export class Analytics {
	private gtag: any;
	private mixpanel: any;

	constructor() {
		if (typeof window !== 'undefined') {
			this.gtag = window.gtag;
			this.mixpanel = window.mixpanel;
		}
	}

	// Page views
	trackPageView(path: string, title?: string) {
		this.gtag?.('event', 'page_view', {
			page_path: path,
			page_title: title
		});

		this.mixpanel?.track('Page View', {
			path,
			title
		});
	}

	// Marketing events
	trackMarketingEvent(action: string, params?: any) {
		const events: Record<string, string> = {
			hero_cta_click: 'marketing_hero_cta',
			pricing_view: 'marketing_pricing_view',
			plan_select: 'marketing_plan_select',
			demo_start: 'marketing_demo_start',
			content_download: 'marketing_content_download',
			newsletter_signup: 'marketing_newsletter_signup'
		};

		const eventName = events[action] || action;

		this.gtag?.('event', eventName, {
			...params,
			event_category: 'Marketing'
		});

		this.mixpanel?.track(eventName, params);
	}

	// Conversion tracking
	trackConversion(type: string, value?: number, currency: string = 'EUR') {
		this.gtag?.('event', 'conversion', {
			send_to: `AW-XXXXX/${type}`,
			value,
			currency
		});

		this.mixpanel?.track('Conversion', {
			type,
			value,
			currency
		});
	}

	// A/B test tracking
	trackABTest(testId: string, variant: string, action: string) {
		this.gtag?.('event', 'ab_test_interaction', {
			test_id: testId,
			variant_id: variant,
			action
		});
	}
}

export const analytics = new Analytics();
```

### 8.2 Conversion Funnel

```yaml
Marketing Funnel Tracking:
  Awareness:
    - Landing page view
    - Blog article read
    - Resource download

  Interest:
    - Feature page view
    - Pricing page view
    - Demo interaction
    - Video watch

  Consideration:
    - Pricing calculator use
    - Plan comparison
    - FAQ interaction
    - Contact form view

  Intent:
    - Sign up button click
    - Trial start
    - Contact form submit
    - Demo request

  Purchase:
    - Account creation
    - Plan selection
    - Payment complete

  Retention:
    - First link created
    - Feature adoption
    - Upgrade to paid
```

## 9. Beispiel-Implementierungen

### 9.1 Homepage mit A/B Testing

```svelte
<!-- src/routes/(marketing)/+page.svelte -->
<script lang="ts">
	import { page } from '$app/stores';
	import SEO from '$lib/components/SEO.svelte';
	import HeroControl from '$lib/components/hero/HeroControl.svelte';
	import HeroValue from '$lib/components/hero/HeroValue.svelte';
	import HeroSocial from '$lib/components/hero/HeroSocial.svelte';
	import Features from '$lib/components/marketing/Features.svelte';
	import Testimonials from '$lib/components/marketing/Testimonials.svelte';
	import PricingPreview from '$lib/components/marketing/PricingPreview.svelte';
	import { analytics } from '$lib/analytics';

	let { data } = $props();

	// Select hero variant based on A/B test
	const heroComponents = {
		control: HeroControl,
		value: HeroValue,
		social: HeroSocial
	};

	const HeroComponent = heroComponents[data.abVariant?.homepage?.id || 'control'];

	// Track page view with variant
	$effect(() => {
		analytics.trackPageView('/', 'Homepage');
		if (data.abVariant?.homepage) {
			analytics.trackABTest('homepage-hero', data.abVariant.homepage.id, 'view');
		}
	});
</script>

<SEO
	title="uLoad - Short Links That Work Harder"
	description="Professional URL management with real-time analytics, QR codes, and custom domains. Start free today."
	schema={{
		'@context': 'https://schema.org',
		'@type': 'WebSite',
		name: 'uLoad',
		url: 'https://ulo.ad',
		potentialAction: {
			'@type': 'SearchAction',
			target: 'https://ulo.ad/search?q={search_term_string}',
			'query-input': 'required name=search_term_string'
		}
	}}
/>

<HeroComponent
	onCtaClick={() => {
		analytics.trackMarketingEvent('hero_cta_click', {
			variant: data.abVariant?.homepage?.id
		});
	}}
/>

<Features />
<Testimonials items={data.testimonials} />
<PricingPreview />
```

### 9.2 Landing Page Template

```svelte
<!-- src/routes/(marketing)/lp/[campaign]/+page.svelte -->
<script lang="ts">
	import { page } from '$app/stores';
	import DynamicLandingPage from '$lib/components/landing/DynamicLandingPage.svelte';
	import { analytics } from '$lib/analytics';

	let { data } = $props();

	// Track landing page view
	$effect(() => {
		analytics.trackMarketingEvent('landing_page_view', {
			campaign: data.campaign,
			source: $page.url.searchParams.get('utm_source'),
			medium: $page.url.searchParams.get('utm_medium'),
			variant: data.variant
		});
	});
</script>

<DynamicLandingPage
	config={data.landingPageConfig}
	variant={data.variant}
	onConversion={(type) => {
		analytics.trackConversion(`lp_${data.campaign}_${type}`);
	}}
/>
```

## 10. Deployment & Maintenance

### 10.1 Deployment Strategie

```yaml
Deployment Pipeline:
  Development:
    - Feature branches
    - Preview deployments
    - A/B test configuration

  Staging:
    - Full site preview
    - Performance testing
    - SEO validation
    - A/B test validation

  Production:
    - Blue-green deployment
    - CDN cache invalidation
    - Analytics verification
    - Monitor core web vitals
```

### 10.2 Maintenance Tasks

```yaml
Daily:
  - Monitor analytics
  - Check A/B test performance
  - Review form submissions
  - Monitor uptime

Weekly:
  - Update blog content
  - Review A/B test results
  - Update testimonials
  - Check broken links

Monthly:
  - SEO audit
  - Performance review
  - Content updates
  - A/B test planning
  - Analytics report

Quarterly:
  - Full site audit
  - Competitor analysis
  - Design refresh evaluation
  - A/B test winner implementation
```

## Zusammenfassung

Diese Architektur bietet:

1. **Skalierbare Struktur** für Marketing-Website mit mehreren Seiten
2. **Flexibles A/B/C Testing** System für kontinuierliche Optimierung
3. **Klare Trennung** zwischen Marketing und Produkt
4. **Performance-optimiert** durch Prerendering und Code-Splitting
5. **SEO-freundlich** mit strukturierten Daten und Metadaten
6. **Mehrsprachigkeit** vorbereitet
7. **Analytics-Integration** für datengetriebene Entscheidungen
8. **Content Management** flexibel über CMS oder Files

Die Implementierung kann schrittweise erfolgen, beginnend mit den wichtigsten Seiten (Homepage, Pricing, Features) und dann erweitert werden.

---

_Erstellt am: Januar 2025_
_Projekt: uLoad Marketing Website_
_Version: 1.0_
