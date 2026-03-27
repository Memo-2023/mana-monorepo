import { HTTPException } from 'hono/http-exception';

export class BadRequestError extends HTTPException {
	constructor(message: string) {
		super(400, { message });
	}
}

export class UnauthorizedError extends HTTPException {
	constructor(message = 'Unauthorized') {
		super(401, { message });
	}
}

export class ForbiddenError extends HTTPException {
	constructor(message = 'Forbidden') {
		super(403, { message });
	}
}

export class NotFoundError extends HTTPException {
	constructor(message = 'Not found') {
		super(404, { message });
	}
}

export class ConflictError extends HTTPException {
	constructor(message = 'Conflict') {
		super(409, { message });
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
