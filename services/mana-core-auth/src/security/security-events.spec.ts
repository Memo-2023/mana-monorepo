/**
 * Security Events Service Tests
 */

import * as fs from 'fs';
import * as path from 'path';

describe('SecurityEventsService contract', () => {
	const servicePath = path.resolve(__dirname, 'security-events.service.ts');
	let serviceContent: string;

	beforeAll(() => {
		serviceContent = fs.readFileSync(servicePath, 'utf8');
	});

	describe('event types', () => {
		const requiredEvents = [
			'login_success',
			'login_failure',
			'register',
			'logout',
			'token_refreshed',
			'sso_token_exchange',
			'password_changed',
			'password_reset_requested',
			'password_reset_completed',
			'email_verified',
			'account_deleted',
			'account_locked',
			'api_key_created',
			'api_key_revoked',
			'api_key_validated',
			'api_key_validation_failed',
			'org_created',
			'org_member_invited',
			'org_member_removed',
		];

		it.each(requiredEvents)('should define event type: %s', (eventType) => {
			expect(serviceContent).toContain(`'${eventType}'`);
		});
	});

	describe('fire-and-forget pattern', () => {
		it('should catch errors in logEvent and never throw', () => {
			// The logEvent method must have a try-catch that logs warnings
			expect(serviceContent).toContain('catch (error)');
			expect(serviceContent).toContain('Failed to log security event');
		});
	});

	describe('request info extraction', () => {
		it('should extract IP from x-forwarded-for header', () => {
			expect(serviceContent).toContain('x-forwarded-for');
		});

		it('should extract user-agent from request', () => {
			expect(serviceContent).toContain('user-agent');
		});
	});
});

describe('AccountLockoutService contract', () => {
	const servicePath = path.resolve(__dirname, 'account-lockout.service.ts');
	let serviceContent: string;

	beforeAll(() => {
		serviceContent = fs.readFileSync(servicePath, 'utf8');
	});

	it('should define MAX_ATTEMPTS = 5', () => {
		expect(serviceContent).toContain('MAX_ATTEMPTS = 5');
	});

	it('should define ATTEMPT_WINDOW_MINUTES = 15', () => {
		expect(serviceContent).toContain('ATTEMPT_WINDOW_MINUTES = 15');
	});

	it('should define LOCKOUT_DURATION_MINUTES = 30', () => {
		expect(serviceContent).toContain('LOCKOUT_DURATION_MINUTES = 30');
	});

	it('should normalize email to lowercase', () => {
		expect(serviceContent).toContain('email.toLowerCase()');
	});

	it('should fail open on errors (not lock users out if DB fails)', () => {
		// On error, checkLockout should return locked: false
		expect(serviceContent).toContain('return { locked: false }');
	});

	it('should clear attempts on successful login', () => {
		expect(serviceContent).toContain('clearAttempts');
		expect(serviceContent).toContain('delete(loginAttempts)');
	});
});

describe('Auth Controller lockout integration', () => {
	const controllerPath = path.resolve(__dirname, '../auth/auth.controller.ts');
	let controllerContent: string;

	beforeAll(() => {
		controllerContent = fs.readFileSync(controllerPath, 'utf8');
	});

	it('should check lockout before attempting login', () => {
		expect(controllerContent).toContain('accountLockout.checkLockout');
	});

	it('should throw ForbiddenException with ACCOUNT_LOCKED code when locked', () => {
		expect(controllerContent).toContain("code: 'ACCOUNT_LOCKED'");
	});

	it('should include retryAfter in lockout response', () => {
		expect(controllerContent).toContain('retryAfter: lockout.remainingSeconds');
	});

	it('should clear attempts after successful login', () => {
		expect(controllerContent).toContain('accountLockout.clearAttempts');
	});

	it('should record failed attempts on login failure', () => {
		expect(controllerContent).toContain('accountLockout.recordAttempt');
	});

	it('should not count email-not-verified as failed attempt', () => {
		expect(controllerContent).toContain('ForbiddenException');
		// The catch block should re-throw ForbiddenException before recording attempt
		const loginMethodContent = controllerContent.slice(
			controllerContent.indexOf('async login('),
			controllerContent.indexOf('async logout(')
		);
		const forbiddenCheckIndex = loginMethodContent.indexOf('instanceof ForbiddenException');
		const recordAttemptIndex = loginMethodContent.indexOf('recordAttempt');
		expect(forbiddenCheckIndex).toBeLessThan(recordAttemptIndex);
	});
});

describe('API Key validation rate limiting', () => {
	const controllerPath = path.resolve(__dirname, '../api-keys/api-keys.controller.ts');
	let controllerContent: string;

	beforeAll(() => {
		controllerContent = fs.readFileSync(controllerPath, 'utf8');
	});

	it('should have rate limiting on validate endpoint', () => {
		expect(controllerContent).toContain('@Throttle');
		expect(controllerContent).toContain('limit: 10');
	});

	it('should use ThrottlerGuard', () => {
		expect(controllerContent).toContain('ThrottlerGuard');
	});

	it('should log successful and failed validations', () => {
		expect(controllerContent).toContain('API_KEY_VALIDATED');
		expect(controllerContent).toContain('API_KEY_VALIDATION_FAILED');
	});

	it('should only log key prefix, never the full key', () => {
		expect(controllerContent).toContain("substring(0, 16) + '...'");
	});
});
