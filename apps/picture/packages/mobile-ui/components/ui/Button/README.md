# Button

Pressable button with variants, sizes, and icon support.

## Installation

\`\`\`bash
npx @memoro/ui add button
\`\`\`

## Usage

\`\`\`tsx
import { Button } from '@/components/ui/Button';

<Button title="Click me" variant="primary" onPress={() => {}} />
<Button title="With Icon" icon="add" onPress={() => {}} />
<Button title="Loading" loading={true} />
\`\`\`

## Variants

- \`primary\` (default) - Blue background
- \`secondary\` - Gray background
- \`danger\` - Red background
- \`ghost\` - Transparent background
- \`outline\` - Transparent with border

## Sizes

- \`sm\` - Small
- \`md\` (default) - Medium
- \`lg\` - Large

See full documentation in component file.
