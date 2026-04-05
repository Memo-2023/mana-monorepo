/**
 * @mana/eslint-config
 *
 * Shared ESLint configuration for Manacore monorepo.
 * Import configs based on your project type:
 *
 * @example SvelteKit Web App
 * ```js
 * import { baseConfig, typescriptConfig, svelteConfig, prettierConfig } from '@mana/eslint-config';
 * export default [...baseConfig, ...typescriptConfig, ...svelteConfig, ...prettierConfig];
 * ```
 *
 * @example Expo Mobile App
 * ```js
 * import { baseConfig, typescriptConfig, reactConfig, prettierConfig } from '@mana/eslint-config';
 * export default [...baseConfig, ...typescriptConfig, ...reactConfig, ...prettierConfig];
 * ```
 *
 * @example NestJS Backend
 * ```js
 * import { baseConfig, typescriptConfig, nestjsConfig, prettierConfig } from '@mana/eslint-config';
 * export default [...baseConfig, ...typescriptConfig, ...nestjsConfig, ...prettierConfig];
 * ```
 *
 * @example TypeScript Package (no framework)
 * ```js
 * import { baseConfig, typescriptConfig, prettierConfig } from '@mana/eslint-config';
 * export default [...baseConfig, ...typescriptConfig, ...prettierConfig];
 * ```
 */

export { baseConfig } from './base.js';
export { typescriptConfig } from './typescript.js';
export { svelteConfig } from './svelte.js';
export { reactConfig } from './react.js';
export { nestjsConfig } from './nestjs.js';
export { prettierConfig } from './prettier.js';

// Default export: base + typescript + prettier (for simple TS packages)
import { baseConfig } from './base.js';
import { typescriptConfig } from './typescript.js';
import { prettierConfig } from './prettier.js';

export default [...baseConfig, ...typescriptConfig, ...prettierConfig];
