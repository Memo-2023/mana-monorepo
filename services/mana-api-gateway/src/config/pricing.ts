export const PRICING_TIERS = {
	free: {
		name: 'Free',
		rateLimit: 10, // 10 requests/minute
		monthlyCredits: 100,
		endpoints: ['search'] as const, // Only search
		features: [] as const,
		price: 0,
	},
	pro: {
		name: 'Pro',
		rateLimit: 100, // 100 requests/minute
		monthlyCredits: 5000,
		endpoints: ['search', 'stt', 'tts'] as const,
		features: ['priority_support'] as const,
		price: 1900, // 19 EUR in cents
	},
	enterprise: {
		name: 'Enterprise',
		rateLimit: 1000, // 1000 requests/minute
		monthlyCredits: 50000,
		endpoints: ['search', 'stt', 'tts'] as const,
		features: ['priority_support', 'sla', 'dedicated_support'] as const,
		price: 9900, // 99 EUR in cents
	},
} as const;

export type PricingTier = keyof typeof PRICING_TIERS;

// Credit costs per operation
export const CREDIT_COSTS = {
	search: 1, // 1 credit per search
	stt: {
		perMinute: 10, // 10 credits per minute of audio
	},
	tts: {
		per1000Chars: 1, // 1 credit per 1000 characters
	},
} as const;

export type Endpoint = 'search' | 'stt' | 'tts';
