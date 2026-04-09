/**
 * Context module — barrel exports.
 */

export { contextSpaceTable, documentTable, CONTEXT_GUEST_SEED } from './collections';
export * from './queries';
export type {
	LocalContextSpace,
	LocalDocument,
	DocumentType,
	DocumentMetadata,
	Space,
	Document,
} from './types';
