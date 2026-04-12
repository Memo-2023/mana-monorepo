/**
 * Wallpaper / Background Configuration Types
 *
 * Re-exports from @mana/shared-theme (canonical source) plus app-local constants.
 *
 * The wallpaper system supports four sources:
 * - none: theme default (solid color via CSS variables)
 * - predefined: bundled images per theme variant
 * - generated: CSS gradients/solids stored as parameters
 * - upload: user-uploaded images via mana-media
 *
 * Resolution: activeScene.wallpaper > globalSettings.wallpaper > DEFAULT_WALLPAPER_CONFIG
 */

export type {
	WallpaperSource,
	WallpaperSourceNone,
	WallpaperSourcePredefined,
	WallpaperSourceGenerated,
	WallpaperSourceUpload,
	WallpaperSolid,
	WallpaperGradient,
	WallpaperOverlay,
	WallpaperConfig,
} from '@mana/shared-theme';

import type { WallpaperConfig } from '@mana/shared-theme';

/** Default (empty) wallpaper config — theme background color, no image. */
export const DEFAULT_WALLPAPER_CONFIG: WallpaperConfig = {
	source: { type: 'none' },
};
