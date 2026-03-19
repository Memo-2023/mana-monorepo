/**
 * Format time in seconds to MM:SS format
 */
export function formatTime(seconds: number): string {
	const mins = Math.floor(seconds / 60);
	const secs = Math.floor(seconds % 60);
	return `${mins}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Format time in seconds to MM:SS.ms format
 */
export function formatTimeWithMs(seconds: number): string {
	const mins = Math.floor(seconds / 60);
	const secs = Math.floor(seconds % 60);
	const ms = Math.floor((seconds % 1) * 100);
	return `${mins}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
}

/**
 * Parse MM:SS or MM:SS.ms format to seconds
 */
export function parseTime(timeString: string): number | null {
	const match = timeString.match(/^(\d+):(\d{2})(?:\.(\d{2}))?$/);
	if (!match) return null;

	const mins = parseInt(match[1], 10);
	const secs = parseInt(match[2], 10);
	const ms = match[3] ? parseInt(match[3], 10) / 100 : 0;

	return mins * 60 + secs + ms;
}

/**
 * Format duration for display (e.g., "3:45")
 */
export function formatDuration(seconds: number): string {
	if (seconds < 60) {
		return `0:${Math.floor(seconds).toString().padStart(2, '0')}`;
	}
	const mins = Math.floor(seconds / 60);
	const secs = Math.floor(seconds % 60);
	return `${mins}:${secs.toString().padStart(2, '0')}`;
}
