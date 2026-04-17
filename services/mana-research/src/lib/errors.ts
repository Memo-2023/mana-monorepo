/**
 * Custom errors for mana-research. All extend HTTPException so `serviceErrorHandler`
 * from @mana/shared-hono renders them with status + legacy `{ statusCode, message, details }`.
 */

import { HTTPException } from 'hono/http-exception';

export class BadRequestError extends HTTPException {
	constructor(message: string, cause?: Record<string, unknown>) {
		super(400, { message, cause });
	}
}

export class UnauthorizedError extends HTTPException {
	constructor(message = 'Unauthorized') {
		super(401, { message });
	}
}

export class NotFoundError extends HTTPException {
	constructor(message = 'Not found') {
		super(404, { message });
	}
}

export class InsufficientCreditsError extends HTTPException {
	constructor(
		public readonly required: number,
		public readonly available: number
	) {
		super(402, {
			message: 'Insufficient credits',
			cause: { required, available },
		});
	}
}

export class ProviderError extends HTTPException {
	constructor(providerId: string, message: string, status: 500 | 502 | 503 = 502) {
		super(status, {
			message: `Provider "${providerId}" error: ${message}`,
			cause: { providerId },
		});
	}
}

export class ProviderNotConfiguredError extends HTTPException {
	constructor(providerId: string) {
		super(501, {
			message: `Provider "${providerId}" is not configured — no API key available`,
			cause: { providerId },
		});
	}
}
