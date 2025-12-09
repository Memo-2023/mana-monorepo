import { PUBLIC_BACKEND_URL } from '$env/static/public';

/**
 * API Configuration
 * Uses environment variable PUBLIC_BACKEND_URL with fallback for development
 */
export const API_BASE = `${PUBLIC_BACKEND_URL || 'http://localhost:3015'}/api/v1`;
