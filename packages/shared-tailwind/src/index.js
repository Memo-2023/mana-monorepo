/**
 * @mana/shared-tailwind
 *
 * Shared Tailwind CSS configuration for all Mana apps.
 *
 * Exports:
 * - preset: Tailwind preset with colors, themes, and design tokens
 * - colors: Color palette definitions
 *
 * Also available:
 * - @mana/shared-tailwind/themes.css: CSS custom properties for runtime theming
 */

export { default as preset } from './preset.js';
export { colors, default as defaultColors } from './colors.js';
