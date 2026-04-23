import { z } from 'zod';

/**
 * Zod schema for the visibility enum. Use this in module record schemas
 * so every table validates the same way on writes.
 *
 *   export const TaskSchema = z.object({
 *     id: z.string().uuid(),
 *     title: z.string(),
 *     visibility: VisibilityLevelSchema,
 *     ...
 *   });
 */
export const VisibilityLevelSchema = z.enum(['private', 'space', 'unlisted', 'public']);

/**
 * Unlisted-token shape — 32 base64url chars (see tokens.ts). Zod check
 * enforces format so a corrupt/shortened token from a manual edit gets
 * rejected at the schema layer.
 */
export const UnlistedTokenSchema = z
	.string()
	.regex(/^[A-Za-z0-9_-]{32}$/, 'must be a 32-char base64url token');
