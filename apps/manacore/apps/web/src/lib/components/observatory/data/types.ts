export type PlantType =
	| 'oak'
	| 'birch'
	| 'youngTree'
	| 'reed'
	| 'waterLily'
	| 'moss'
	| 'shrub'
	| 'sprout'
	| 'stump'
	| 'swampCluster';

export type AppStatus = 'prototype' | 'alpha' | 'beta' | 'production' | 'mature';

export type HealthStatus = 'up' | 'degraded' | 'down' | 'unknown';

export interface CategoryScores {
	backend: number;
	frontend: number;
	database: number;
	testing: number;
	deployment: number;
	documentation: number;
	security: number;
	ux: number;
}

export interface AppData {
	id: string;
	name: string;
	displayName: string;
	score: number;
	status: AppStatus;
	health: HealthStatus;
	plantType: PlantType;
	categories: CategoryScores;
	trend: number;
	lakeId: string;
	position: { x: number; y: number };
}

export interface LakeData {
	id: string;
	name: string;
	label: string;
	path: string;
	color: string;
	colorDeep: string;
	clarity: number; // 0-1, 1 = crystal clear
	level: number; // 0-1, normalized fill level
	position: { x: number; y: number };
}

export interface RiverData {
	id: string;
	from: string;
	to: string;
	path: string;
	flowSpeed: number; // 0-1
	width: number;
}

export interface EcosystemState {
	apps: AppData[];
	lakes: LakeData[];
	rivers: RiverData[];
	timeOfDay: number; // 0-24
	systemHealth: 'sunny' | 'cloudy' | 'stormy';
}
