# Icon

Cross-platform icon component (SF Symbols on iOS, Ionicons elsewhere).

## Installation
\`\`\`bash
npx @memoro/ui add icon
\`\`\`

## Usage
\`\`\`tsx
import { Icon } from '@/components/ui/Icon';

<Icon name="heart" size={24} color="#FF0000" />
<Icon name="star" size={32} weight="bold" />
\`\`\`

## Common Icons
- Navigation: \`chevron-back\`, \`chevron-forward\`, \`arrow-back\`, \`close\`, \`menu\`
- Actions: \`add\`, \`remove\`, \`checkmark\`, \`search\`, \`filter\`, \`settings\`, \`trash\`, \`share\`
- Media: \`image\`, \`images\`, \`camera\`, \`heart\`, \`star\`, \`bookmark\`
- UI: \`grid\`, \`list\`, \`eye\`, \`information-circle\`, \`warning\`
- People: \`person\`, \`people\`, \`home\`

See Icon.tsx for full icon list (100+ icons mapped).

## Platform
- **iOS:** Uses SF Symbols (native, better performance)
- **Android/Web:** Uses Ionicons

See full documentation in component file.
