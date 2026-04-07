/**
 * @mana/shared-icons
 *
 * Phosphor Icons for all Mana SvelteKit web apps
 * https://phosphoricons.com
 *
 * Usage:
 * import { House, User, Gear, Plus } from '@mana/shared-icons';
 *
 * <House size={24} weight="bold" />
 * <User size={20} weight="regular" class="text-blue-500" />
 *
 * Available weights: thin, light, regular, bold, fill, duotone
 */

export * from 'phosphor-svelte';
export { ICON_REGISTRY, ICON_CATEGORIES, getIconComponent, getAllIconNames } from './icon-registry';
export type { IconName } from './icon-registry';
