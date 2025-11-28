/**
 * Data exports - For backward compatibility
 *
 * Note: In the new architecture, content-specific data should be imported
 * from dedicated packages like @zitare/content-quotes, @zitare/content-proverbs, etc.
 *
 * These exports are kept for backward compatibility with existing apps.
 */

// Re-export all data modules for backward compatibility
export { quotesDE } from './quotes/de';
export { quotesEN } from './quotes/en';
export { authorsDE } from './authors/de';
export { authorsEN } from './authors/en';
