/**
 * Zod validation helper for Hono route handlers.
 */

import type { Context } from 'hono';
import type { ZodType, ZodError, ZodTypeDef } from 'zod';

type ValidationResult<T> = { success: true; data: T } | { success: false; response: Response };

function formatZodError(error: ZodError): string {
	return error.issues.map((i) => i.message).join(', ');
}

/**
 * Validate JSON body against a Zod schema.
 * Returns parsed data on success, or sends a 400 response on failure.
 */
export async function validateBody<Output, Def extends ZodTypeDef = ZodTypeDef, Input = Output>(
	c: Context,
	schema: ZodType<Output, Def, Input>
): Promise<ValidationResult<Output>> {
	let raw: unknown;
	try {
		raw = await c.req.json();
	} catch {
		return {
			success: false,
			response: c.json({ success: false, error: 'Invalid JSON body' }, 400),
		};
	}

	const result = schema.safeParse(raw);
	if (!result.success) {
		return {
			success: false,
			response: c.json({ success: false, error: formatZodError(result.error) }, 400),
		};
	}

	return { success: true, data: result.data };
}

/**
 * Validate query parameters against a Zod schema.
 */
export function validateQuery<Output, Def extends ZodTypeDef = ZodTypeDef, Input = Output>(
	c: Context,
	schema: ZodType<Output, Def, Input>
): ValidationResult<Output> {
	const raw = c.req.query();

	const result = schema.safeParse(raw);
	if (!result.success) {
		return {
			success: false,
			response: c.json({ success: false, error: formatZodError(result.error) }, 400),
		};
	}

	return { success: true, data: result.data };
}
