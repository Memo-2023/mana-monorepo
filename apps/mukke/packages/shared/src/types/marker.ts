export type MarkerType =
	| 'verse'
	| 'hook'
	| 'bridge'
	| 'intro'
	| 'outro'
	| 'drop'
	| 'breakdown'
	| 'custom';

export interface Marker {
	id: string;
	beatId: string;
	type: MarkerType;
	label?: string | null;
	startTime: number;
	endTime?: number | null;
	color?: string | null;
	sortOrder?: number | null;
}

export interface CreateMarkerDto {
	beatId: string;
	type: MarkerType;
	label?: string;
	startTime: number;
	endTime?: number;
	color?: string;
}

export interface UpdateMarkerDto {
	type?: MarkerType;
	label?: string;
	startTime?: number;
	endTime?: number;
	color?: string;
	sortOrder?: number;
}

export const MARKER_COLORS: Record<MarkerType, string> = {
	verse: '#3B82F6', // blue
	hook: '#EF4444', // red
	bridge: '#8B5CF6', // purple
	intro: '#22C55E', // green
	outro: '#F97316', // orange
	drop: '#EC4899', // pink
	breakdown: '#14B8A6', // teal
	custom: '#6B7280', // gray
};
