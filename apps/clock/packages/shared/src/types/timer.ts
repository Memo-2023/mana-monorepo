export type TimerStatus = 'idle' | 'running' | 'paused' | 'finished';

export interface Timer {
	id: string;
	userId: string;
	label: string | null;
	durationSeconds: number;
	remainingSeconds: number | null;
	status: TimerStatus;
	startedAt: string | null;
	pausedAt: string | null;
	sound: string | null;
	createdAt: string;
	updatedAt: string;
}

export interface CreateTimerInput {
	label?: string;
	durationSeconds: number;
	sound?: string;
}

export interface UpdateTimerInput {
	label?: string;
	durationSeconds?: number;
	sound?: string;
}

export function formatDuration(seconds: number): string {
	const hours = Math.floor(seconds / 3600);
	const minutes = Math.floor((seconds % 3600) / 60);
	const secs = seconds % 60;

	if (hours > 0) {
		return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
	}
	return `${minutes}:${secs.toString().padStart(2, '0')}`;
}

export function parseDuration(formatted: string): number {
	const parts = formatted.split(':').map(Number);
	if (parts.length === 3) {
		return parts[0] * 3600 + parts[1] * 60 + parts[2];
	}
	if (parts.length === 2) {
		return parts[0] * 60 + parts[1];
	}
	return parts[0];
}
