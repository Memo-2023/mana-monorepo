import { PUBLIC_BACKEND_URL, PUBLIC_MANA_CORE_AUTH_URL } from '$env/static/public';

/**
 * API Configuration
 * Uses environment variables with fallbacks for development
 */
export const API_BASE = `${PUBLIC_BACKEND_URL || 'http://localhost:3015'}/api/v1`;

/**
 * Mana Core Auth URL
 * Central authentication service URL
 */
export const MANA_AUTH_URL = PUBLIC_MANA_CORE_AUTH_URL || 'http://localhost:3001';
