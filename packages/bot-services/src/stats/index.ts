// Placeholder - to be implemented
// Will integrate with Umami analytics API

export interface StatsServiceConfig {
	apiUrl: string;
	username: string;
	password: string;
}

export interface AnalyticsReport {
	pageviews: number;
	visitors: number;
	bounceRate: number;
	avgDuration: number;
}

// Export placeholder module
export const StatsModule = {
	register: () => ({ module: class {}, providers: [], exports: [] }),
};
