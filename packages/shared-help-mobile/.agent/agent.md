# Shared Help Mobile Expert

## Module: @manacore/shared-help-mobile
**Path:** `packages/shared-help-mobile`
**Description:** React Native components for the help/documentation system in mobile apps. Provides a complete help screen with FAQ, features, shortcuts, guides, changelog, and contact sections. Built with Expo and styled with NativeWind.
**Tech Stack:** React Native, Expo SDK 52+, NativeWind 4.0+, TypeScript
**Key Dependencies:** @manacore/shared-help-types, @manacore/shared-help-content

## Identity
You are the **Shared Help Mobile Expert**. You have deep knowledge of:
- React Native component architecture for help systems
- NativeWind styling (Tailwind CSS for React Native)
- Mobile-optimized help content presentation
- Search UX patterns for mobile
- Category-based content navigation
- Expo best practices

## Expertise
- Building mobile help screens with React Native
- Implementing expandable FAQ lists
- Search functionality with real-time results
- Category tabs for content navigation
- Mobile-friendly contact cards
- Performance optimization for content-heavy screens

## Code Structure
```
packages/shared-help-mobile/src/
├── screens/
│   └── HelpScreen.tsx        # Main help screen component
├── components/
│   ├── FAQList.tsx           # FAQ list with categories
│   ├── FAQItem.tsx           # Single FAQ item (expandable)
│   ├── FeaturesList.tsx      # Features grid/list
│   ├── FeatureCard.tsx       # Single feature card
│   ├── HelpSearchBar.tsx     # Search input with debounce
│   ├── CategoryTabs.tsx      # Horizontal scrollable tabs
│   └── ContactCard.tsx       # Support contact information
├── hooks/
│   └── useHelpContent.ts     # Content loading and search hooks
├── types.ts                  # Component prop types
└── index.ts                  # Public exports
```

## Key Patterns

### Main Screen Component
```typescript
import { HelpScreen } from '@manacore/shared-help-mobile';

<HelpScreen
  content={helpContent}
  appName="Chat"
  appId="chat"
  translations={translations}
  defaultSection="faq"
/>
```

### Hook-Based Content Loading
```typescript
const { content, loading, error } = useHelpContent({
  appId: 'chat',
  locale: 'en',
  centralContent,
  appContent,
});
```

### Search Hook
```typescript
const { search } = useHelpSearch(content);
const results = search('authentication', 10);
```

## HelpScreen Component

### Props
```typescript
interface HelpScreenProps {
  content: HelpContent;
  appName: string;
  appId: string;
  translations: HelpTranslations;
  onBack?: () => void;
  defaultSection?: HelpSection;
}

type HelpSection =
  | 'faq'
  | 'features'
  | 'shortcuts'
  | 'getting-started'
  | 'changelog'
  | 'contact';
```

### Features
- Search bar with real-time filtering
- Category tabs (auto-hidden during search)
- Section-based navigation
- Expandable FAQ items
- Search results with excerpts
- Empty states for each section

### Layout
```
┌─────────────────────────┐
│ Help                    │
│ Get support for Chat    │
├─────────────────────────┤
│ 🔍 Search help...       │
├─────────────────────────┤
│ [FAQ] Features Shortcuts│ ← Category tabs
├─────────────────────────┤
│ Content area            │
│                         │
│ (FAQ list, features,    │
│  or search results)     │
└─────────────────────────┘
```

## Components

### FAQList
Displays FAQ items with category filtering:
```typescript
<FAQList
  items={content.faq}
  translations={translations}
  showCategories={true}
  maxItems={10}
  expandFirst={false}
/>
```

### FAQItem
Single expandable FAQ with animation:
```typescript
<FAQItem
  item={faqItem}
  expanded={isExpanded}
  onToggle={() => setExpanded(!isExpanded)}
/>
```

### FeaturesList
Grid or list of feature cards:
```typescript
<FeaturesList
  items={content.features}
  translations={translations}
  layout="grid"
/>
```

### FeatureCard
Single feature with icon and description:
```typescript
<FeatureCard
  feature={featureItem}
  onPress={() => handleFeaturePress(featureItem)}
/>
```

### HelpSearchBar
Search input with clear button:
```typescript
<HelpSearchBar
  placeholder="Search help..."
  onSearch={handleSearch}
  onClear={handleClear}
  debounce={300}
/>
```

### CategoryTabs
Horizontal scrollable tabs:
```typescript
<CategoryTabs
  sections={sections}
  activeSection={activeSection}
  onSectionChange={setActiveSection}
/>
```

### ContactCard
Support contact information:
```typescript
<ContactCard
  contact={content.contact}
  translations={translations}
  onEmailPress={handleEmail}
  onUrlPress={handleUrl}
/>
```

## Hooks

### useHelpContent
Load and merge help content:
```typescript
interface UseHelpContentOptions {
  appId: string;
  locale: SupportedLanguage;
  centralContent?: HelpContent;
  appContent?: HelpContent;
}

interface UseHelpContentResult {
  content: HelpContent;
  loading: boolean;
  error: Error | null;
}
```

Usage:
```typescript
const { content, loading, error } = useHelpContent({
  appId: 'chat',
  locale: 'en',
  centralContent: centralHelpContent,
  appContent: chatSpecificContent,
});
```

### useHelpSearch
Search help content:
```typescript
const { search } = useHelpSearch(content);

// Returns SearchResult[]
const results = search(query, limit);
```

## Styling with NativeWind

### Dark Mode Support
All components support dark mode via NativeWind:
```typescript
<View className="bg-white dark:bg-gray-800">
  <Text className="text-gray-900 dark:text-gray-100">
    Content
  </Text>
</View>
```

### Common Class Patterns
```typescript
// Cards
"bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700"

// Buttons
"px-4 py-2 bg-primary-500 dark:bg-primary-600 rounded-lg"

// Text
"text-gray-900 dark:text-gray-100"
"text-gray-600 dark:text-gray-400"
```

## Translations Interface

### Required Translations
```typescript
interface HelpTranslations {
  title: string;
  subtitle?: string;
  searchPlaceholder: string;
  sections: {
    faq: string;
    features: string;
    shortcuts: string;
    gettingStarted: string;
    changelog: string;
    contact: string;
  };
  search: {
    noResults: string;
    resultsCount: string;
  };
  faq: {
    noItems: string;
    categories: Record<FAQCategory, string>;
  };
  features: {
    noItems: string;
  };
  shortcuts: {
    noItems: string;
  };
  gettingStarted: {
    noItems: string;
  };
  changelog: {
    noItems: string;
  };
  common: {
    back: string;
    showMore: string;
    showLess: string;
  };
}
```

## Integration Points
- **Used by:**
  - Mobile apps (Expo/React Native) for help screens
  - App-specific help implementations
- **Depends on:**
  - `@manacore/shared-help-types` - Type definitions
  - `@manacore/shared-help-content` - Content loading and search
  - React Native - UI framework
  - Expo - Mobile framework
  - NativeWind - Styling

## Peer Dependencies
```json
{
  "expo": ">=52.0.0",
  "nativewind": "^4.0.0",
  "react": "18.3.1",
  "react-native": ">=0.76.0"
}
```

## Common Tasks

### Implement Help Screen
```typescript
import { HelpScreen } from '@manacore/shared-help-mobile';
import { useHelpContent } from '@manacore/shared-help-mobile';

export function AppHelpScreen() {
  const { content, loading } = useHelpContent({
    appId: 'chat',
    locale: 'en',
    centralContent: globalHelpContent,
  });

  if (loading) return <LoadingSpinner />;

  return (
    <HelpScreen
      content={content}
      appName="Chat"
      appId="chat"
      translations={translations}
      defaultSection="faq"
      onBack={() => navigation.goBack()}
    />
  );
}
```

### Custom Search Implementation
```typescript
import { useHelpSearch } from '@manacore/shared-help-mobile';

function CustomSearchScreen({ content }) {
  const { search } = useHelpSearch(content);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);

  function handleSearch(q: string) {
    setQuery(q);
    if (q.trim().length >= 2) {
      setResults(search(q, 10));
    } else {
      setResults([]);
    }
  }

  return (
    <View>
      <HelpSearchBar onSearch={handleSearch} />
      {results.map(result => (
        <SearchResultCard key={result.id} result={result} />
      ))}
    </View>
  );
}
```

## Type Safety Note
Type-checking is skipped for this package during build:
```json
"type-check": "echo 'Skipping type-check: requires React Native environment'"
```

This is because React Native types require the full RN environment.

## How to Use
```
"Read packages/shared-help-mobile/.agent/ and help me with..."
```
