# Creating a New Content Collection

This document explains how to create and configure a new content collection in our Astro-based website.

## What are Content Collections?

Content collections in Astro are a way to organize and validate content in your project. They allow you to:

- Group related content together
- Define a schema for validating content
- Query content with TypeScript type safety
- Support multiple languages (de/en)

## Step 1: Define the Collection Schema

First, you need to define the schema for your new collection in the `src/content/config.ts` file:

```typescript
// 1. Import the defineCollection and z functions
import { defineCollection, z } from 'astro:content';

// 2. Define your collection schema
const myNewCollection = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    description: z.string(),
    lastUpdated: z.date(),
    lang: z.enum(['de', 'en']),
    // Add any other fields specific to your collection
    category: z.string(),
    order: z.number().optional(),
    // Add custom fields as needed
    customField: z.string().optional()
  })
});

// 3. Add your collection to the collections export
export const collections = {
  // Existing collections...
  'myNewCollection': myNewCollection,
};
```

## Step 2: Create the Directory Structure

Create the necessary directories for your content collection:

```bash
mkdir -p src/content/my-new-collection/de src/content/my-new-collection/en
```

Our project organizes content by language, so we create separate directories for German (de) and English (en) content.

## Step 3: Add Content Files

Create content files in the appropriate language directories. We use `.mdx` files for content that includes Markdown with JSX components:

**German Example** (`src/content/my-new-collection/de/example.mdx`):

```markdown
---
title: "Beispieltitel"
description: "Eine Beispielbeschreibung"
lastUpdated: 2025-02-26
lang: "de"
category: "example"
order: 1
customField: "Beispielwert"
---

# Beispielinhalt

Dies ist ein Beispielinhalt für die neue Content Collection.
```

**English Example** (`src/content/my-new-collection/en/example.mdx`):

```markdown
---
title: "Example Title"
description: "An example description"
lastUpdated: 2025-02-26
lang: "en"
category: "example"
order: 1
customField: "Example value"
---

# Example Content

This is example content for the new content collection.
```

## Step 4: Create Components for Displaying Content

Create components to display your content. For example, create a component to display a list of items from your collection:

```astro
---
// src/components/MyCollectionList.astro
import { getCollection } from 'astro:content';
import { getLangFromUrl } from '../i18n/utils';

const lang = getLangFromUrl(Astro.url);
const items = await getCollection('my-new-collection', ({ data }) => {
  return data.lang === lang;
});

// Sort items if needed
const sortedItems = [...items].sort((a, b) => {
  return (a.data.order || 0) - (b.data.order || 0);
});
---

<div class="collection-list">
  {sortedItems.map((item) => (
    <a 
      href={`/${lang}/my-collection/${item.slug.replace(`${lang}/`, '')}`}
      class="collection-item"
    >
      <h3>{item.data.title}</h3>
      <p>{item.data.description}</p>
    </a>
  ))}
</div>
```

Also create a component for displaying a single item:

```astro
---
// src/components/MyCollectionItem.astro
import type { CollectionEntry } from 'astro:content';

interface Props {
  item: CollectionEntry<'my-new-collection'>;
}

const { item } = Astro.props;
const { Content } = await item.render();
---

<article class="collection-item">
  <h1>{item.data.title}</h1>
  <p class="description">{item.data.description}</p>
  <div class="content">
    <Content />
  </div>
</article>
```

## Step 5: Create Page Routes

Create pages to display your collection. You'll typically need:

1. A listing page that shows all items
2. A dynamic route for individual items

**Listing Page** (`src/pages/de/my-collection/index.astro` and `src/pages/en/my-collection/index.astro`):

```astro
---
import { getCollection } from 'astro:content';
import Layout from '../../../layouts/Layout.astro';
import { getLangFromUrl, useTranslations } from '../../../i18n/utils';

const lang = getLangFromUrl(Astro.url);
const t = useTranslations(lang);

const items = await getCollection('my-new-collection', ({ data }) => {
  return data.lang === lang;
});

const sortedItems = [...items].sort((a, b) => {
  return (a.data.order || 0) - (b.data.order || 0);
});
---

<Layout title={t('myCollection.title')} description={t('myCollection.description')}>
  <main>
    <h1>{t('myCollection.title')}</h1>
    <p>{t('myCollection.description')}</p>
    
    <div class="collection-grid">
      {sortedItems.map((item) => (
        <a 
          href={`/${lang}/my-collection/${item.slug.replace(`${lang}/`, '')}`}
          class="collection-card"
        >
          <h3>{item.data.title}</h3>
          <p>{item.data.description}</p>
        </a>
      ))}
    </div>
  </main>
</Layout>
```

**Dynamic Route** (`src/pages/de/my-collection/[...slug].astro` and `src/pages/en/my-collection/[...slug].astro`):

```astro
---
import { getCollection } from 'astro:content';
import Layout from '../../../layouts/Layout.astro';
import { getLangFromUrl } from '../../../i18n/utils';
import MyCollectionItem from '../../../components/MyCollectionItem.astro';

export async function getStaticPaths() {
  const lang = 'de'; // or 'en' depending on the file
  const items = await getCollection('my-new-collection', ({ data }) => {
    return data.lang === lang;
  });

  return items.map((item) => ({
    params: { slug: item.slug.replace(`${lang}/`, '') },
    props: { item },
  }));
}

const { item } = Astro.props;
---

<Layout title={item.data.title} description={item.data.description}>
  <main>
    <MyCollectionItem item={item} />
  </main>
</Layout>
```

## Step 6: Add Navigation Links (Optional)

Update your navigation components to include links to your new collection:

```astro
---
// In your navigation component
import { getLangFromUrl, useTranslations } from '../i18n/utils';

const lang = getLangFromUrl(Astro.url);
const t = useTranslations(lang);
---

<nav>
  <!-- Existing navigation items -->
  <a href={`/${lang}/my-collection`}>{t('nav.myCollection')}</a>
</nav>
```

## Step 7: Add Translations (Optional)

If your site uses translations, add the necessary translation strings to your i18n files:

```typescript
// src/i18n/ui.ts
export const languages = {
  de: {
    'myCollection': {
      'title': 'Meine Sammlung',
      'description': 'Beschreibung meiner Sammlung'
    },
    'nav': {
      'myCollection': 'Meine Sammlung'
    }
  },
  en: {
    'myCollection': {
      'title': 'My Collection',
      'description': 'Description of my collection'
    },
    'nav': {
      'myCollection': 'My Collection'
    }
  }
};
```

## Testing Your Collection

After setting up your collection, test it by:

1. Building the site: `npm run build`
2. Checking for any TypeScript or schema validation errors
3. Previewing the site: `npm run preview`
4. Navigating to your collection pages to ensure they display correctly

## Example: Creating a "Contracts" Collection

Here's a complete example of creating a "contracts" collection:

1. **Schema Definition**:

```typescript
// src/content/config.ts
const contractsCollection = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    description: z.string(),
    lastUpdated: z.date(),
    lang: z.enum(['de', 'en']),
    category: z.string(),
    order: z.number().optional(),
    downloadUrl: z.string().optional(),
    previewEnabled: z.boolean().default(false)
  })
});

export const collections = {
  // Other collections...
  contracts: contractsCollection,
};
```

2. **Directory Structure**:
```
src/content/contracts/
├── de/
│   ├── nutzungsbedingungen.mdx
│   └── datenschutz.mdx
└── en/
    ├── terms-of-service.mdx
    └── privacy-policy.mdx
```

3. **Content Example**:
```markdown
---
title: "Nutzungsbedingungen"
description: "Allgemeine Nutzungsbedingungen für unsere Plattform"
lastUpdated: 2025-02-26
lang: "de"
category: "legal"
order: 1
downloadUrl: "/downloads/nutzungsbedingungen.pdf"
previewEnabled: true
---

# Nutzungsbedingungen

## 1. Geltungsbereich

Diese Nutzungsbedingungen regeln die Nutzung unserer Plattform...
```

4. **Component for Displaying Contracts**:
```astro
---
// src/components/ContractItem.astro
import type { CollectionEntry } from 'astro:content';

interface Props {
  contract: CollectionEntry<'contracts'>;
}

const { contract } = Astro.props;
const { Content } = await contract.render();
---

<article class="contract">
  <h1>{contract.data.title}</h1>
  <p class="description">{contract.data.description}</p>
  
  {contract.data.previewEnabled && (
    <div class="content">
      <Content />
    </div>
  )}
  
  {contract.data.downloadUrl && (
    <a href={contract.data.downloadUrl} class="download-button">
      Download als PDF
    </a>
  )}
</article>
```

5. **Page Routes**:
```astro
---
// src/pages/de/contracts/[...slug].astro
import { getCollection } from 'astro:content';
import Layout from '../../../layouts/Layout.astro';
import ContractItem from '../../../components/ContractItem.astro';

export async function getStaticPaths() {
  const contracts = await getCollection('contracts', ({ data }) => {
    return data.lang === 'de';
  });

  return contracts.map((contract) => ({
    params: { slug: contract.slug.replace('de/', '') },
    props: { contract },
  }));
}

const { contract } = Astro.props;
---

<Layout title={contract.data.title} description={contract.data.description}>
  <main>
    <ContractItem contract={contract} />
  </main>
</Layout>
```

## Complete Implementation Walkthrough

Below is a detailed walkthrough of all the steps we took to implement a new "Contracts" content collection:

### 1. Define the Collection Schema

First, we added the contracts collection schema to `src/content/config.ts`:

```typescript
const contractsCollection = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    description: z.string(),
    lastUpdated: z.date(),
    lang: z.enum(['de', 'en']),
    category: z.string(),
    order: z.number().optional(),
    downloadUrl: z.string().optional(),
    previewEnabled: z.boolean().default(false)
  })
});

export const collections = {
  // Other collections...
  contracts: contractsCollection,
};
```

### 2. Create Directory Structure

We created the necessary directories for our content:

```bash
mkdir -p src/content/contracts/de src/content/contracts/en
```

### 3. Create Components

We created two components for displaying contracts:

**ContractCard.astro** - For displaying contract cards in the listing page:

```astro
---
import type { CollectionEntry } from 'astro:content';
import { getLangFromUrl } from '../i18n/utils';

interface Props {
  contract: CollectionEntry<'contracts'>;
}

const { contract } = Astro.props;
const lang = getLangFromUrl(Astro.url);
const cleanSlug = contract.slug.replace(`${lang}/`, '');
---

<a 
  href={`/${lang}/contracts/${cleanSlug}`}
  class="block bg-background-card rounded-lg border border-border p-6 hover:bg-background-cardHover hover:border-primary-DEFAULT/30 transition-all duration-DEFAULT"
>
  <div class="flex items-center justify-between">
    <div>
      <h3 class="text-xl font-semibold text-text-primary group-hover:text-primary-DEFAULT transition-colors">
        {contract.data.title}
      </h3>
      <p class="text-text-secondary mt-2">
        {contract.data.description}
      </p>
      <p class="text-xs text-text-tertiary mt-4">
        Zuletzt aktualisiert: {contract.data.lastUpdated.toLocaleDateString()}
      </p>
    </div>
    <div class="text-text-secondary group-hover:text-primary-DEFAULT transition-colors">
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-6 h-6">
        <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
      </svg>
    </div>
  </div>
</a>
```

**ContractDetail.astro** - For displaying a single contract's details:

```astro
---
import type { CollectionEntry } from 'astro:content';
import { getLangFromUrl, useTranslations } from '../i18n/utils';

interface Props {
  contract: CollectionEntry<'contracts'>;
}

const { contract } = Astro.props;
const { Content } = await contract.render();
const lang = getLangFromUrl(Astro.url);
const t = useTranslations(lang);
---

<article class="prose prose-lg dark:prose-invert max-w-none">
  <header class="mb-8">
    <h1 class="text-3xl font-bold mb-4">{contract.data.title}</h1>
    <p class="text-text-secondary mb-4">{contract.data.description}</p>
    <p class="text-sm text-text-tertiary">
      {t('contracts.lastUpdated')}: {contract.data.lastUpdated.toLocaleDateString()}
    </p>
  </header>

  {contract.data.previewEnabled && (
    <div class="contract-content">
      <Content />
    </div>
  )}
  
  {contract.data.downloadUrl && (
    <div class="mt-8">
      <a 
        href={contract.data.downloadUrl} 
        class="inline-flex items-center px-6 py-3 bg-primary-DEFAULT text-white rounded-lg hover:bg-primary-hover transition-colors"
        download
      >
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5 mr-2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
        </svg>
        {t('contracts.download')}
      </a>
    </div>
  )}
</article>
```

### 4. Create Page Routes

We created the necessary page routes for both German and English:

**Listing Pages** (`src/pages/de/contracts/index.astro` and `src/pages/en/contracts/index.astro`):

```astro
---
import { getCollection, getEntry } from "astro:content";
import Layout from "../../../layouts/Layout.astro";
import ContractCard from "../../../components/ContractCard.astro";
import CallToAction from "../../../components/CallToAction.astro";
import { getLangFromUrl, useTranslations } from "../../../i18n/utils";

const lang = getLangFromUrl(Astro.url);
const t = useTranslations(lang);

// Get contracts in current language
const contractEntries = await getCollection("contracts", ({ data }) => {
  return data.lang === "de"; // or "en" for English version
});

// Sort contracts by category and then by order
const sortedContracts = [...contractEntries].sort((a, b) => {
  // First sort by category
  if (a.data.category !== b.data.category) {
    return a.data.category.localeCompare(b.data.category);
  }
  // Then sort by order within the same category
  const orderA = a.data.order || 0;
  const orderB = b.data.order || 0;
  return orderA - orderB;
});

// Group contracts by category
const contractsByCategory = sortedContracts.reduce((acc, contract) => {
  const category = contract.data.category;
  if (!acc[category]) {
    acc[category] = [];
  }
  acc[category].push(contract);
  return acc;
}, {});

const pageTitle = t('contracts.title');
const pageDescription = t('contracts.description');
---

<Layout title={pageTitle} description={pageDescription}>
  <main class="max-w-4xl mx-auto px-6 sm:px-8 md:px-12 py-16">
    <h1 class="text-4xl font-bold text-text-primary mb-6">{pageTitle}</h1>
    <p class="text-xl text-text-secondary mb-12">{pageDescription}</p>

    {Object.entries(contractsByCategory).map(([category, contracts]) => (
      <div class="mb-12">
        <h2 class="text-2xl font-semibold text-text-primary mb-6 capitalize">
          {category === "legal" ? (lang === "de" ? "Rechtliche Dokumente" : "Legal Documents") : category}
        </h2>
        <div class="grid grid-cols-1 gap-4">
          {contracts.map((contract) => (
            <ContractCard contract={contract} />
          ))}
        </div>
      </div>
    ))}

    <CallToAction
      title={lang === "de" ? "Fragen zu unseren Verträgen?" : "Questions about our contracts?"}
      description={lang === "de" 
        ? "Unser Team steht Ihnen bei Fragen zu unseren Verträgen und rechtlichen Dokumenten gerne zur Verfügung."
        : "Our team is available to answer any questions about our contracts and legal documents."}
      buttonText={lang === "de" ? "Kontakt aufnehmen" : "Contact Us"}
      buttonLink={`/${lang}/contact`}
    />
  </main>
</Layout>
```

**Dynamic Routes** (`src/pages/de/contracts/[...slug].astro` and `src/pages/en/contracts/[...slug].astro`):

```astro
---
import { getCollection } from "astro:content";
import Layout from "../../../layouts/Layout.astro";
import { getLangFromUrl, useTranslations } from "../../../i18n/utils";
import ContractDetail from "../../../components/ContractDetail.astro";
import CallToAction from "../../../components/CallToAction.astro";

export async function getStaticPaths() {
  const contracts = await getCollection("contracts", ({ data }) => {
    return data.lang === "de"; // or "en" for English version
  });

  return contracts.map((contract) => {
    return {
      params: { slug: contract.slug.replace("de/", "") }, // or "en/" for English version
      props: { contract },
    };
  });
}

const { contract } = Astro.props;
const lang = getLangFromUrl(Astro.url);
const t = useTranslations(lang);

// Check if content is in the correct language
if (contract.data.lang !== lang) {
  // Get all contracts
  const allContracts = await getCollection("contracts");
  // Find matching content in the correct language
  const localizedContract = allContracts.find(
    (c) => c.data.slug === contract.data.slug && c.data.lang === lang
  );

  if (localizedContract) {
    return Astro.redirect(`/${lang}/contracts/${localizedContract.data.slug}`);
  }
}
---

<Layout title={contract.data.title} description={contract.data.description}>
  <main class="max-w-4xl mx-auto px-6 sm:px-8 md:px-12 py-16">
    <div class="mb-8">
      <a href={`/${lang}/contracts`} class="inline-flex items-center text-text-secondary hover:text-primary-DEFAULT transition-colors">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5 mr-2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
        </svg>
        {t('contracts.backToOverview')}
      </a>
    </div>

    <ContractDetail contract={contract} />

    <div class="mt-16">
      <CallToAction
        title={lang === "de" ? "Fragen zu diesem Dokument?" : "Questions about this document?"}
        description={lang === "de" 
          ? "Unser Team steht Ihnen bei Fragen zu unseren Verträgen und rechtlichen Dokumenten gerne zur Verfügung."
          : "Our team is available to answer any questions about our contracts and legal documents."}
        buttonText={lang === "de" ? "Kontakt aufnehmen" : "Contact Us"}
        buttonLink={`/${lang}/contact`}
      />
    </div>
  </main>
</Layout>
```

### 5. Add Sample Content

We created sample contract files in both German and English:

**German Example** (`src/content/contracts/de/nutzungsbedingungen.mdx`):

```markdown
---
title: "Nutzungsbedingungen"
description: "Allgemeine Nutzungsbedingungen für unsere Plattform"
lastUpdated: 2025-02-26
lang: "de"
category: "legal"
order: 1
downloadUrl: "/downloads/nutzungsbedingungen.pdf"
previewEnabled: true
---

# Nutzungsbedingungen

## 1. Geltungsbereich

Diese Nutzungsbedingungen regeln die Nutzung unserer Plattform...
```

**English Example** (`src/content/contracts/en/terms-of-service.mdx`):

```markdown
---
title: "Terms of Service"
description: "General terms of service for our platform"
lastUpdated: 2025-02-26
lang: "en"
category: "legal"
order: 1
downloadUrl: "/downloads/terms-of-service.pdf"
previewEnabled: true
---

# Terms of Service

## 1. Scope

These Terms of Service govern the use of our platform...
```

### 6. Add Translations

We added translations for the contracts section in `src/i18n/ui.ts`:

```typescript
// German translations
'contracts.title': 'Verträge & Rechtliches',
'contracts.description': 'Alle rechtlichen Dokumente und Verträge für unsere Plattform',
'contracts.download': 'Als PDF herunterladen',
'contracts.lastUpdated': 'Zuletzt aktualisiert',
'contracts.backToOverview': 'Zurück zur Übersicht',

// English translations
'contracts.title': 'Contracts & Legal',
'contracts.description': 'All legal documents and contracts for our platform',
'contracts.download': 'Download as PDF',
'contracts.lastUpdated': 'Last updated',
'contracts.backToOverview': 'Back to overview',
```

### 7. Update Navigation

We added a link to the contracts page in the Footer component:

```astro
<li>
  <a
    href={isGerman ? "/de/contracts" : "/en/contracts"}
    class="text-gray-300 hover:text-white hover:underline transition-colors"
  >
    {isGerman ? "Verträge" : "Contracts"}
  </a>
</li>
```

### 8. Testing

After implementing all these components, you should test the contracts pages by:

1. Building the site: `npm run build`
2. Checking for any TypeScript or schema validation errors
3. Previewing the site: `npm run preview`
4. Navigating to `/de/contracts` and `/en/contracts` to ensure they display correctly
5. Clicking on individual contracts to ensure the detail pages work properly
6. Testing the download functionality if you have PDF files available

### 9. Next Steps

To further enhance your contracts collection, consider:

1. Creating actual PDF files for download in the `/public/downloads/` directory
2. Adding more contract types (privacy policy, terms of use, etc.)
3. Implementing a search functionality for contracts
4. Adding version history for contracts to track changes over time
