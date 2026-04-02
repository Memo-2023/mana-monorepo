export interface WorldClock {
	id: string;
	userId: string;
	timezone: string; // IANA timezone e.g. 'America/New_York'
	cityName: string;
	sortOrder: number;
	createdAt: string;
}

export interface CreateWorldClockInput {
	timezone: string;
	cityName: string;
}

export interface TimezoneInfo {
	timezone: string;
	city: string;
}
