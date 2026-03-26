/**
 * @manacore/shared-help-types
 * Shared TypeScript types and Zod schemas for Help content
 */

// Content types
export * from './content.js';

// Zod schemas for validation
export * from './schemas.js';

// Search types
export * from './search.js';

// Shared Mana FAQ content
export { getManaFAQs, getManaFeature } from './mana-faq.js';

// Shared Privacy FAQ content
export { getPrivacyFAQs, type PrivacyFAQOptions } from './privacy-faq.js';
