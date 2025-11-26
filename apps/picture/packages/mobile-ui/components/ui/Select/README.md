# Select

Horizontal scrollable selector component for choosing between multiple options.

## Features

- ✅ Horizontal scrolling options
- ✅ Icons and emoji support
- ✅ Optional subtitles and descriptions
- ✅ Loading and error states
- ✅ Info toggle for details
- ✅ Fully customizable colors
- ✅ Disabled state

## Installation

```bash
npx @memoro/ui add select
```

**Dependencies:** text, icon

## Usage

### Basic Select

```tsx
import { Select, SelectOption } from '@/components/ui/Select';

const options: SelectOption[] = [
  { id: '1', label: 'Option 1', icon: '🎨' },
  { id: '2', label: 'Option 2', icon: '🖼️' },
  { id: '3', label: 'Option 3', icon: '📸' },
];

<Select
  options={options}
  selectedId="1"
  onSelect={(option) => console.log('Selected:', option)}
/>
```

### With Title

```tsx
<Select
  title="Choose a theme"
  options={themeOptions}
  selectedId={selectedTheme}
  onSelect={setSelectedTheme}
/>
```

### With Subtitles and Descriptions

```tsx
const options: SelectOption[] = [
  {
    id: 'basic',
    label: 'Basic',
    icon: '⚡',
    subtitle: 'Fast & Simple',
    description: 'Quick generation with basic settings',
  },
  {
    id: 'advanced',
    label: 'Advanced',
    icon: '🚀',
    subtitle: 'Powerful',
    description: 'Full control over all parameters',
  },
];

<Select
  options={options}
  selectedId={selectedMode}
  onSelect={(option) => setSelectedMode(option.id)}
/>
```

### Loading State

```tsx
<Select
  options={[]}
  selectedId={null}
  onSelect={() => {}}
  loading={true}
/>
```

### Error State

```tsx
<Select
  options={[]}
  selectedId={null}
  onSelect={() => {}}
  error="Failed to load options"
  onRetry={() => refetch()}
/>
```

### Custom Colors

```tsx
<Select
  options={options}
  selectedId={selectedId}
  onSelect={handleSelect}
  backgroundColor="#F9FAFB"
  borderColor="#E5E7EB"
  selectedBackgroundColor="#10B981"
  selectedBorderColor="#10B981"
  textColor="#111827"
  selectedTextColor="#FFFFFF"
/>
```

### Custom Width

```tsx
<Select
  options={options}
  selectedId={selectedId}
  onSelect={handleSelect}
  minWidth={200}
/>
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `options` | `SelectOption[]` | - | **Required** - Options to display |
| `selectedId` | `string \| null` | - | **Required** - Currently selected option ID |
| `onSelect` | `(option: SelectOption) => void` | - | **Required** - Callback when option is selected |
| `loading` | `boolean` | `false` | Show loading state |
| `error` | `string \| null` | `null` | Error message |
| `onRetry` | `() => void` | - | Retry callback for error state |
| `disabled` | `boolean` | `false` | Disable selection |
| `minWidth` | `number` | `160` | Minimum width for each option |
| `title` | `string` | - | Title above options |
| `backgroundColor` | `string` | `'#FFFFFF'` | Background color for unselected options |
| `borderColor` | `string` | `'#E5E7EB'` | Border color for unselected options |
| `selectedBackgroundColor` | `string` | `'#3B82F6'` | Background color for selected option |
| `selectedBorderColor` | `string` | `'#3B82F6'` | Border color for selected option |
| `textColor` | `string` | `'#111827'` | Text color for unselected options |
| `selectedTextColor` | `string` | `'#FFFFFF'` | Text color for selected option |
| `style` | `ViewStyle` | - | Additional styles |

## SelectOption Type

```typescript
type SelectOption = {
  id: string;
  label: string;
  subtitle?: string;
  icon?: string;
  description?: string;
};
```

## Default Styling

- **Background:** White (#FFFFFF)
- **Border:** Light gray (#E5E7EB)
- **Selected Background:** Blue (#3B82F6)
- **Selected Border:** Blue (#3B82F6)
- **Text Color:** Dark gray (#111827)
- **Selected Text:** White (#FFFFFF)
- **Min Width:** 160px
- **Border Radius:** 12px
- **Padding:** 16px

## Examples

### Size Selector

```tsx
const sizeOptions: SelectOption[] = [
  { id: 'sm', label: 'Small', icon: '📦', subtitle: '256x256' },
  { id: 'md', label: 'Medium', icon: '📦', subtitle: '512x512' },
  { id: 'lg', label: 'Large', icon: '📦', subtitle: '1024x1024' },
];

<Select
  title="Image Size"
  options={sizeOptions}
  selectedId={selectedSize}
  onSelect={(opt) => setSelectedSize(opt.id)}
/>
```

### Style Selector

```tsx
const styleOptions: SelectOption[] = [
  { id: 'realistic', label: 'Realistic', icon: '📷' },
  { id: 'artistic', label: 'Artistic', icon: '🎨' },
  { id: 'cartoon', label: 'Cartoon', icon: '🎭' },
  { id: 'anime', label: 'Anime', icon: '🌸' },
];

<Select
  options={styleOptions}
  selectedId={style}
  onSelect={(opt) => setStyle(opt.id)}
  minWidth={120}
/>
```

### Model Selector with Details

```tsx
const modelOptions: SelectOption[] = [
  {
    id: 'gpt4',
    label: 'GPT-4',
    icon: '🧠',
    subtitle: 'Most capable',
    description: 'Best for complex tasks requiring deep understanding',
  },
  {
    id: 'gpt35',
    label: 'GPT-3.5',
    icon: '⚡',
    subtitle: 'Fast',
    description: 'Great for quick responses and simple tasks',
  },
];

<Select
  title="AI Model"
  options={modelOptions}
  selectedId={selectedModel}
  onSelect={(opt) => setSelectedModel(opt.id)}
/>
```

### Async Loading

```tsx
function ModelSelector() {
  const [models, setModels] = useState<SelectOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadModels = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchModels();
      setModels(data);
    } catch (err) {
      setError('Failed to load models');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadModels();
  }, []);

  return (
    <Select
      options={models}
      selectedId={selectedModel}
      onSelect={(opt) => setSelectedModel(opt.id)}
      loading={loading}
      error={error}
      onRetry={loadModels}
    />
  );
}
```

### Color Scheme Selector

```tsx
const colorOptions: SelectOption[] = [
  { id: 'light', label: 'Light', icon: '☀️' },
  { id: 'dark', label: 'Dark', icon: '🌙' },
  { id: 'auto', label: 'Auto', icon: '✨' },
];

<Select
  title="Theme"
  options={colorOptions}
  selectedId={theme}
  onSelect={(opt) => setTheme(opt.id)}
  minWidth={100}
/>
```

## Info Toggle

When options have `subtitle` or `description`:
- Info icon appears in header
- Clicking toggles visibility of:
  - Subtitles under each option
  - Description panel for selected option

## States

### Loading
- Shows spinner with "Loading..." text
- Disabled interaction

### Error
- Shows error message
- Optional retry button via `onRetry`

### Disabled
- Reduces opacity to 0.5
- Prevents selection

## Common Patterns

### Multi-Section Select

```tsx
<View style={{ gap: 24 }}>
  <Select
    title="Model"
    options={modelOptions}
    selectedId={selectedModel}
    onSelect={(opt) => setSelectedModel(opt.id)}
  />

  <Select
    title="Quality"
    options={qualityOptions}
    selectedId={selectedQuality}
    onSelect={(opt) => setSelectedQuality(opt.id)}
  />
</View>
```

### Conditional Options

```tsx
const options = isPremium
  ? [...basicOptions, ...premiumOptions]
  : basicOptions;

<Select
  options={options}
  selectedId={selectedId}
  onSelect={handleSelect}
/>
```

## Notes

- Options scroll horizontally
- Selected option is highlighted with custom colors
- Icons can be emoji or icon names (when using Icon component)
- Info toggle only appears when options have details
- Press feedback with opacity change
- Fully accessible with proper labeling
- Works great for 3-8 options
- For many options, consider vertical list instead
