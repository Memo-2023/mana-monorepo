import type { AppData, AppStatus, PlantType, CategoryScores } from './types';
import { APP_POSITIONS } from './layout';

interface AppDefinition {
	id: string;
	displayName: string;
	score: number;
	status: AppStatus;
	categories: CategoryScores;
	previousScore?: number;
}

function getPlantType(status: AppStatus, score: number): PlantType {
	if (score >= 85) return 'oak';
	if (score >= 70) return 'birch';
	if (status === 'beta' && score >= 55) return 'youngTree';
	if (status === 'beta') return 'reed';
	if (status === 'alpha') return 'sprout';
	if (status === 'prototype') return 'sprout';
	return 'youngTree';
}

// Real ManaScore data from 2026-03-24 audits
const APP_DEFINITIONS: AppDefinition[] = [
	{
		id: 'calendar',
		displayName: 'Calendar',
		score: 97,
		previousScore: 82,
		status: 'mature',
		categories: {
			backend: 95,
			frontend: 96,
			database: 92,
			testing: 90,
			deployment: 92,
			documentation: 98,
			security: 92,
			ux: 95,
		},
	},
	{
		id: 'todo',
		displayName: 'Todo',
		score: 96,
		previousScore: 80,
		status: 'mature',
		categories: {
			backend: 94,
			frontend: 95,
			database: 88,
			testing: 90,
			deployment: 92,
			documentation: 95,
			security: 90,
			ux: 94,
		},
	},
	{
		id: 'contacts',
		displayName: 'Contacts',
		score: 94,
		status: 'production',
		categories: {
			backend: 92,
			frontend: 90,
			database: 88,
			testing: 88,
			deployment: 90,
			documentation: 92,
			security: 85,
			ux: 85,
		},
	},
	{
		id: 'mana',
		displayName: 'Mana',
		score: 88,
		status: 'production',
		categories: {
			backend: 55,
			frontend: 90,
			database: 70,
			testing: 72,
			deployment: 90,
			documentation: 88,
			security: 80,
			ux: 92,
		},
	},
	{
		id: 'presi',
		displayName: 'Presi',
		score: 86,
		status: 'mature',
		categories: {
			backend: 90,
			frontend: 82,
			database: 85,
			testing: 82,
			deployment: 75,
			documentation: 90,
			security: 85,
			ux: 82,
		},
	},
	{
		id: 'storage',
		displayName: 'Storage',
		score: 84,
		previousScore: 55,
		status: 'production',
		categories: {
			backend: 88,
			frontend: 84,
			database: 82,
			testing: 78,
			deployment: 65,
			documentation: 78,
			security: 78,
			ux: 75,
		},
	},
	{
		id: 'chat',
		displayName: 'Chat',
		score: 82,
		status: 'production',
		categories: {
			backend: 90,
			frontend: 82,
			database: 95,
			testing: 60,
			deployment: 92,
			documentation: 85,
			security: 82,
			ux: 80,
		},
	},
	{
		id: 'picture',
		displayName: 'Picture',
		score: 81,
		status: 'production',
		categories: {
			backend: 90,
			frontend: 80,
			database: 92,
			testing: 55,
			deployment: 75,
			documentation: 78,
			security: 80,
			ux: 78,
		},
	},
	{
		id: 'music',
		displayName: 'Music',
		score: 80,
		status: 'beta',
		categories: {
			backend: 90,
			frontend: 78,
			database: 90,
			testing: 65,
			deployment: 85,
			documentation: 80,
			security: 78,
			ux: 60,
		},
	},
	{
		id: 'nutriphi',
		displayName: 'NutriPhi',
		score: 63,
		status: 'beta',
		categories: {
			backend: 78,
			frontend: 62,
			database: 80,
			testing: 58,
			deployment: 40,
			documentation: 85,
			security: 68,
			ux: 55,
		},
	},
	{
		id: 'photos',
		displayName: 'Photos',
		score: 62,
		status: 'beta',
		categories: {
			backend: 82,
			frontend: 65,
			database: 72,
			testing: 0,
			deployment: 85,
			documentation: 78,
			security: 65,
			ux: 55,
		},
	},
	{
		id: 'zitare',
		displayName: 'Zitare',
		score: 62,
		status: 'beta',
		categories: {
			backend: 72,
			frontend: 78,
			database: 75,
			testing: 0,
			deployment: 92,
			documentation: 20,
			security: 70,
			ux: 75,
		},
	},
	{
		id: 'context',
		displayName: 'Context',
		score: 60,
		status: 'beta',
		categories: {
			backend: 75,
			frontend: 75,
			database: 82,
			testing: 55,
			deployment: 25,
			documentation: 85,
			security: 68,
			ux: 65,
		},
	},
	{
		id: 'clock',
		displayName: 'Clock',
		score: 58,
		status: 'beta',
		categories: {
			backend: 75,
			frontend: 70,
			database: 72,
			testing: 0,
			deployment: 88,
			documentation: 10,
			security: 60,
			ux: 55,
		},
	},
	{
		id: 'skilltree',
		displayName: 'SkillTree',
		score: 58,
		status: 'beta',
		categories: {
			backend: 65,
			frontend: 68,
			database: 72,
			testing: 28,
			deployment: 55,
			documentation: 62,
			security: 65,
			ux: 72,
		},
	},
	{
		id: 'plants',
		displayName: 'Plants',
		score: 50,
		status: 'alpha',
		categories: {
			backend: 68,
			frontend: 58,
			database: 70,
			testing: 0,
			deployment: 45,
			documentation: 62,
			security: 55,
			ux: 50,
		},
	},
	{
		id: 'cards',
		displayName: 'Cards',
		score: 48,
		status: 'alpha',
		categories: {
			backend: 50,
			frontend: 65,
			database: 30,
			testing: 18,
			deployment: 80,
			documentation: 25,
			security: 55,
			ux: 68,
		},
	},
	{
		id: 'questions',
		displayName: 'Questions',
		score: 48,
		status: 'alpha',
		categories: {
			backend: 88,
			frontend: 62,
			database: 78,
			testing: 0,
			deployment: 10,
			documentation: 72,
			security: 55,
			ux: 55,
		},
	},
	{
		id: 'traces',
		displayName: 'Traces',
		score: 35,
		status: 'alpha',
		categories: {
			backend: 72,
			frontend: 10,
			database: 70,
			testing: 0,
			deployment: 8,
			documentation: 45,
			security: 55,
			ux: 35,
		},
	},
];

export function createMockEcosystem(): AppData[] {
	return APP_DEFINITIONS.map((def) => {
		const pos = APP_POSITIONS[def.id] || { x: 800, y: 500, lakeId: 'auth' };
		const trend = def.previousScore ? def.score - def.previousScore : 0;
		return {
			id: def.id,
			name: def.id,
			displayName: def.displayName,
			score: def.score,
			status: def.status,
			health: 'up' as const,
			plantType: getPlantType(def.status, def.score),
			categories: def.categories,
			trend,
			lakeId: pos.lakeId,
			position: { x: pos.x, y: pos.y },
		};
	});
}
