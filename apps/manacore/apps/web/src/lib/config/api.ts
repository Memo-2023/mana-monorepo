/**
 * API Configuration (Legacy - Deprecated)
 *
 * @deprecated Use runtime.ts instead for proper 12-factor config
 * This file is kept for backward compatibility during migration
 */

import { getAuthUrl as getRuntimeAuthUrl } from './runtime';

/**
 * Get the Mana Core Auth URL dynamically at runtime
 * @deprecated Use getAuthUrl() from './runtime' instead
 */
export async function getAuthUrl(): Promise<string> {
	return getRuntimeAuthUrl();
}
