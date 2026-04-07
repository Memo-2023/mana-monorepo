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

export class TooManyRequestsError extends HTTPException {
	constructor(message = 'Rate limit exceeded') {
		super(429, { message });
	}
}
