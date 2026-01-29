/**
 * Theme Store - Manages theme state
 * Uses shared theme store from @manacore/shared-theme
 */

import { createThemeStore } from '@manacore/shared-theme';

export const theme = createThemeStore({ appId: 'storage' });
