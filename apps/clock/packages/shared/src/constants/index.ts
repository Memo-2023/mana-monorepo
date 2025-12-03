// Popular timezones with city names
export const POPULAR_TIMEZONES = [
	{ timezone: 'America/New_York', city: 'New York', region: 'Americas' },
	{ timezone: 'America/Los_Angeles', city: 'Los Angeles', region: 'Americas' },
	{ timezone: 'America/Chicago', city: 'Chicago', region: 'Americas' },
	{ timezone: 'America/Toronto', city: 'Toronto', region: 'Americas' },
	{ timezone: 'America/Sao_Paulo', city: 'São Paulo', region: 'Americas' },
	{ timezone: 'Europe/London', city: 'London', region: 'Europe' },
	{ timezone: 'Europe/Paris', city: 'Paris', region: 'Europe' },
	{ timezone: 'Europe/Berlin', city: 'Berlin', region: 'Europe' },
	{ timezone: 'Europe/Rome', city: 'Rome', region: 'Europe' },
	{ timezone: 'Europe/Madrid', city: 'Madrid', region: 'Europe' },
	{ timezone: 'Europe/Amsterdam', city: 'Amsterdam', region: 'Europe' },
	{ timezone: 'Europe/Vienna', city: 'Vienna', region: 'Europe' },
	{ timezone: 'Europe/Zurich', city: 'Zurich', region: 'Europe' },
	{ timezone: 'Europe/Moscow', city: 'Moscow', region: 'Europe' },
	{ timezone: 'Asia/Tokyo', city: 'Tokyo', region: 'Asia' },
	{ timezone: 'Asia/Shanghai', city: 'Shanghai', region: 'Asia' },
	{ timezone: 'Asia/Hong_Kong', city: 'Hong Kong', region: 'Asia' },
	{ timezone: 'Asia/Singapore', city: 'Singapore', region: 'Asia' },
	{ timezone: 'Asia/Seoul', city: 'Seoul', region: 'Asia' },
	{ timezone: 'Asia/Mumbai', city: 'Mumbai', region: 'Asia' },
	{ timezone: 'Asia/Dubai', city: 'Dubai', region: 'Asia' },
	{ timezone: 'Australia/Sydney', city: 'Sydney', region: 'Oceania' },
	{ timezone: 'Australia/Melbourne', city: 'Melbourne', region: 'Oceania' },
	{ timezone: 'Pacific/Auckland', city: 'Auckland', region: 'Oceania' },
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
