import type { LocalMood, LocalSequence } from './local-store';

export const guestMoods: LocalMood[] = [
	{
		id: 'fire',
		name: 'Fire',
		colors: ['#ff6b35', '#f72585', '#ff006e'],
		animation: 'flicker',
		isDefault: true,
	},
	{
		id: 'breath',
		name: 'Breath',
		colors: ['#4361ee', '#3a0ca3', '#7209b7'],
		animation: 'pulse',
		isDefault: true,
	},
	{
		id: 'northern-lights',
		name: 'Northern Lights',
		colors: ['#06d6a0', '#118ab2', '#073b4c'],
		animation: 'aurora',
		isDefault: true,
	},
	{
		id: 'sunset',
		name: 'Sunset',
		colors: ['#ff6b6b', '#feca57', '#ff9ff3'],
		animation: 'gradient',
		isDefault: true,
	},
	{
		id: 'ocean',
		name: 'Ocean',
		colors: ['#0077b6', '#00b4d8', '#90e0ef'],
		animation: 'wave',
		isDefault: true,
	},
	{
		id: 'forest',
		name: 'Forest',
		colors: ['#2d6a4f', '#40916c', '#52b788'],
		animation: 'sway',
		isDefault: true,
	},
	{
		id: 'lavender',
		name: 'Lavender',
		colors: ['#7b2cbf', '#9d4edd', '#c77dff'],
		animation: 'pulse',
		isDefault: true,
	},
	{
		id: 'thunder',
		name: 'Thunder',
		colors: ['#14213d', '#fca311', '#e5e5e5'],
		animation: 'flash',
		isDefault: true,
	},
];

export const guestSequences: LocalSequence[] = [
	{
		id: 'evening-flow',
		name: 'Evening Flow',
		moodIds: ['sunset', 'lavender', 'breath'],
		duration: 30,
	},
	{ id: 'nature', name: 'Nature', moodIds: ['forest', 'ocean', 'northern-lights'], duration: 45 },
];
