// Popular timezones with city names and coordinates for map display
export const POPULAR_TIMEZONES = [
	{
		timezone: 'America/New_York',
		city: 'New York',
		region: 'Americas',
		lat: 40.7128,
		lng: -74.006,
	},
	{
		timezone: 'America/Los_Angeles',
		city: 'Los Angeles',
		region: 'Americas',
		lat: 34.0522,
		lng: -118.2437,
	},
	{ timezone: 'America/Chicago', city: 'Chicago', region: 'Americas', lat: 41.8781, lng: -87.6298 },
	{ timezone: 'America/Toronto', city: 'Toronto', region: 'Americas', lat: 43.6532, lng: -79.3832 },
	{
		timezone: 'America/Sao_Paulo',
		city: 'São Paulo',
		region: 'Americas',
		lat: -23.5505,
		lng: -46.6333,
	},
	{
		timezone: 'America/Mexico_City',
		city: 'Mexico City',
		region: 'Americas',
		lat: 19.4326,
		lng: -99.1332,
	},
	{
		timezone: 'America/Buenos_Aires',
		city: 'Buenos Aires',
		region: 'Americas',
		lat: -34.6037,
		lng: -58.3816,
	},
	{
		timezone: 'America/Vancouver',
		city: 'Vancouver',
		region: 'Americas',
		lat: 49.2827,
		lng: -123.1207,
	},
	{ timezone: 'Europe/London', city: 'London', region: 'Europe', lat: 51.5074, lng: -0.1278 },
	{ timezone: 'Europe/Paris', city: 'Paris', region: 'Europe', lat: 48.8566, lng: 2.3522 },
	{ timezone: 'Europe/Berlin', city: 'Berlin', region: 'Europe', lat: 52.52, lng: 13.405 },
	{ timezone: 'Europe/Rome', city: 'Rome', region: 'Europe', lat: 41.9028, lng: 12.4964 },
	{ timezone: 'Europe/Madrid', city: 'Madrid', region: 'Europe', lat: 40.4168, lng: -3.7038 },
	{ timezone: 'Europe/Amsterdam', city: 'Amsterdam', region: 'Europe', lat: 52.3676, lng: 4.9041 },
	{ timezone: 'Europe/Vienna', city: 'Vienna', region: 'Europe', lat: 48.2082, lng: 16.3738 },
	{ timezone: 'Europe/Zurich', city: 'Zurich', region: 'Europe', lat: 47.3769, lng: 8.5417 },
	{ timezone: 'Europe/Moscow', city: 'Moscow', region: 'Europe', lat: 55.7558, lng: 37.6173 },
	{ timezone: 'Europe/Stockholm', city: 'Stockholm', region: 'Europe', lat: 59.3293, lng: 18.0686 },
	{ timezone: 'Europe/Istanbul', city: 'Istanbul', region: 'Europe', lat: 41.0082, lng: 28.9784 },
	{ timezone: 'Asia/Tokyo', city: 'Tokyo', region: 'Asia', lat: 35.6762, lng: 139.6503 },
	{ timezone: 'Asia/Shanghai', city: 'Shanghai', region: 'Asia', lat: 31.2304, lng: 121.4737 },
	{ timezone: 'Asia/Hong_Kong', city: 'Hong Kong', region: 'Asia', lat: 22.3193, lng: 114.1694 },
	{ timezone: 'Asia/Singapore', city: 'Singapore', region: 'Asia', lat: 1.3521, lng: 103.8198 },
	{ timezone: 'Asia/Seoul', city: 'Seoul', region: 'Asia', lat: 37.5665, lng: 126.978 },
	{ timezone: 'Asia/Mumbai', city: 'Mumbai', region: 'Asia', lat: 19.076, lng: 72.8777 },
	{ timezone: 'Asia/Dubai', city: 'Dubai', region: 'Asia', lat: 25.2048, lng: 55.2708 },
	{ timezone: 'Asia/Bangkok', city: 'Bangkok', region: 'Asia', lat: 13.7563, lng: 100.5018 },
	{ timezone: 'Asia/Jakarta', city: 'Jakarta', region: 'Asia', lat: -6.2088, lng: 106.8456 },
	{ timezone: 'Australia/Sydney', city: 'Sydney', region: 'Oceania', lat: -33.8688, lng: 151.2093 },
	{
		timezone: 'Australia/Melbourne',
		city: 'Melbourne',
		region: 'Oceania',
		lat: -37.8136,
		lng: 144.9631,
	},
	{
		timezone: 'Pacific/Auckland',
		city: 'Auckland',
		region: 'Oceania',
		lat: -36.8485,
		lng: 174.7633,
	},
	{ timezone: 'Africa/Cairo', city: 'Cairo', region: 'Africa', lat: 30.0444, lng: 31.2357 },
	{
		timezone: 'Africa/Johannesburg',
		city: 'Johannesburg',
		region: 'Africa',
		lat: -26.2041,
		lng: 28.0473,
	},
	{ timezone: 'Africa/Lagos', city: 'Lagos', region: 'Africa', lat: 6.5244, lng: 3.3792 },
] as const;

// Available alarm sounds
export const ALARM_SOUNDS = [
	{ id: 'default', name: 'Default', nameDE: 'Standard' },
	{ id: 'gentle', name: 'Gentle', nameDE: 'Sanft' },
	{ id: 'classic', name: 'Classic', nameDE: 'Klassisch' },
	{ id: 'digital', name: 'Digital', nameDE: 'Digital' },
	{ id: 'nature', name: 'Nature', nameDE: 'Natur' },
	{ id: 'chime', name: 'Chime', nameDE: 'Glockenspiel' },
] as const;

// Timer presets
export const QUICK_TIMER_PRESETS = [
	{ label: '1 min', seconds: 60 },
	{ label: '3 min', seconds: 180 },
	{ label: '5 min', seconds: 300 },
	{ label: '10 min', seconds: 600 },
	{ label: '15 min', seconds: 900 },
	{ label: '30 min', seconds: 1800 },
	{ label: '45 min', seconds: 2700 },
	{ label: '1 hour', seconds: 3600 },
] as const;

// Default alarm presets (like iOS Clock app)
export const DEFAULT_ALARM_PRESETS = [
	{ time: '06:00', label: 'Früh aufstehen', labelEN: 'Wake up early' },
	{ time: '07:00', label: 'Aufwachen', labelEN: 'Wake up' },
	{ time: '08:00', label: 'Morgen', labelEN: 'Morning' },
	{ time: '12:00', label: 'Mittag', labelEN: 'Noon' },
	{ time: '18:00', label: 'Feierabend', labelEN: 'End of work' },
	{ time: '22:00', label: 'Schlafenszeit', labelEN: 'Bedtime' },
] as const;

// Pomodoro presets
export const POMODORO_PRESETS = [
	{
		name: 'Classic Pomodoro',
		nameDE: 'Klassischer Pomodoro',
		workDuration: 25 * 60,
		breakDuration: 5 * 60,
		longBreakDuration: 15 * 60,
		sessionsBeforeLongBreak: 4,
	},
	{
		name: 'Short Focus',
		nameDE: 'Kurzer Fokus',
		workDuration: 15 * 60,
		breakDuration: 3 * 60,
		longBreakDuration: 10 * 60,
		sessionsBeforeLongBreak: 4,
	},
	{
		name: 'Deep Work',
		nameDE: 'Tiefes Arbeiten',
		workDuration: 50 * 60,
		breakDuration: 10 * 60,
		longBreakDuration: 30 * 60,
		sessionsBeforeLongBreak: 3,
	},
] as const;
