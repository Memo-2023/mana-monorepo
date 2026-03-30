import { HTTPException } from 'hono/http-exception';

export class NotFoundError extends HTTPException {
	constructor(message = 'Not found') {
		super(404, { message });
	}
}

export class BadRequestError extends HTTPException {
	constructor(message = 'Bad request') {
		super(400, { message });
	}
}

export class UnauthorizedError extends HTTPException {
	constructor(message = 'Unauthorized') {
		super(401, { message });
	}
}
