/**
 * Application configuration loaded from environment variables.
 */

export interface Config {
	port: number;
	databaseUrl: string;
	manaAuthUrl: string;
	cors: {
		origins: string[];
	};
	rateLimit: {
		// Max public RSVP submissions per token per hour
		rsvpPerTokenPerHour: number;
		// Hard cap on total RSVPs per token
		rsvpMaxPerToken: number;
	};
}

export function loadConfig(): Config {
	const requiredEnv = (key: string, fallback?: string): string => {
		const value = process.env[key] || fallback;
		if (!value) throw new Error(`Missing required env var: ${key}`);
		return value;
	};

	return {
		port: parseInt(process.env.PORT || '3065', 10),
		databaseUrl: requiredEnv(
			'DATABASE_URL',
			'postgresql://mana:devpassword@localhost:5432/mana_platform'
		),
		manaAuthUrl: requiredEnv('MANA_AUTH_URL', 'http://localhost:3001'),
		cors: {
			origins: (process.env.CORS_ORIGINS || 'http://localhost:5173').split(','),
		},
		rateLimit: {
			rsvpPerTokenPerHour: parseInt(process.env.RSVP_RATE_LIMIT || '60', 10),
			rsvpMaxPerToken: parseInt(process.env.RSVP_MAX_PER_TOKEN || '500', 10),
		},
	};
}
