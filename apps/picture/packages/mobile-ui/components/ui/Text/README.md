# Text

Typography component with predefined text variants.

## Installation

\`\`\`bash
npx @memoro/ui add text
\`\`\`

## Usage

\`\`\`tsx
import { Text } from '@/components/ui/Text';

<Text variant="h1">Heading</Text>
<Text variant="body" color="#666">Body text</Text>
<Text variant="caption" weight="bold">Caption</Text>
\`\`\`

## Variants

- \`title\` - 44px, extra bold
- \`h1\` - 32px, bold
- \`h2\` - 28px, bold
- \`h3\` - 24px, semibold
- \`h4\` - 20px, semibold
- \`bodyLarge\` - 18px
- \`body\` (default) - 16px
- \`bodySmall\` - 14px
- \`caption\` - 12px
- \`label\` - 14px, medium
- \`button\` - 16px, semibold

## Weights

- \`regular\` - 400
- \`medium\` - 500
- \`semibold\` - 600
- \`bold\` - 700

See full documentation in component file.
