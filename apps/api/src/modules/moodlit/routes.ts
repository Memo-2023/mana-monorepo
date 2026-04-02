/**
 * Moodlit module — Preset moods library
 * Ported from apps/moodlit/apps/server
 *
 * Local-first for user moods/sequences.
 * This module serves the default preset library.
 */

import { Hono } from 'hono';

const DEFAULT_MOODS = [
	{ id: 'fire', name: 'Fire', colors: ['#ff6b35', '#f72585', '#ff006e'], animation: 'flicker' },
	{ id: 'breath', name: 'Breath', colors: ['#4361ee', '#3a0ca3', '#7209b7'], animation: 'pulse' },
	{
		id: 'northern-lights',
		name: 'Northern Lights',
		colors: ['#06d6a0', '#118ab2', '#073b4c'],
		animation: 'aurora',
	},
	{ id: 'thunder', name: 'Thunder', colors: ['#14213d', '#fca311', '#e5e5e5'], animation: 'flash' },
	{
		id: 'sunset',
		name: 'Sunset',
		colors: ['#ff6b6b', '#feca57', '#ff9ff3'],
		animation: 'gradient',
	},
	{ id: 'ocean', name: 'Ocean', colors: ['#0077b6', '#00b4d8', '#90e0ef'], animation: 'wave' },
	{ id: 'forest', name: 'Forest', colors: ['#2d6a4f', '#40916c', '#52b788'], animation: 'sway' },
	{
		id: 'lavender',
		name: 'Lavender',
		colors: ['#7b2cbf', '#9d4edd', '#c77dff'],
		animation: 'pulse',
	},
];

const routes = new Hono();

routes.get('/presets', (c) => c.json(DEFAULT_MOODS));

export { routes as moodlitRoutes };
