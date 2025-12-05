/**
 * API Client for TechBase Backend
 * Replaces Supabase with direct calls to NestJS backend
 */

const API_URL = import.meta.env.PUBLIC_BACKEND_URL || 'http://localhost:3021';

interface VoteResult {
	success: boolean;
	newAverage: number;
	voteCount: number;
}

interface CommentResult {
	success: boolean;
	message: string;
}

interface MetricsResult {
	metrics: Record<string, { average: number; count: number }>;
}

/**
 * Submit a vote for a software metric
 */
export async function submitVote(
	softwareId: string,
	metric: string,
	rating: number
): Promise<VoteResult> {
	const res = await fetch(`${API_URL}/api/votes`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ softwareId, metric, rating }),
	});

	if (!res.ok) {
		const error = await res.json().catch(() => ({ message: 'Vote failed' }));
		throw new Error(error.message || 'Failed to submit vote');
	}

	return res.json();
}

/**
 * Get metrics for a specific software
 */
export async function getMetrics(softwareId: string): Promise<MetricsResult> {
	const res = await fetch(`${API_URL}/api/votes/${softwareId}/metrics`);

	if (!res.ok) {
		// Return default metrics on error
		return {
			metrics: {
				easeOfUse: { average: 0, count: 0 },
				featureRichness: { average: 0, count: 0 },
				valueForMoney: { average: 0, count: 0 },
				support: { average: 0, count: 0 },
				reliability: { average: 0, count: 0 },
			},
		};
	}

	return res.json();
}

/**
 * Get all metrics for multiple software items
 */
export async function getAllMetrics(): Promise<
	Record<string, Record<string, { average: number; count: number }>>
> {
	const res = await fetch(`${API_URL}/api/votes/metrics/all`);

	if (!res.ok) {
		return {};
	}

	return res.json();
}

/**
 * Submit a comment for review
 */
export async function submitComment(
	softwareId: string,
	userName: string,
	comment: string
): Promise<CommentResult> {
	const res = await fetch(`${API_URL}/api/comments`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ softwareId, userName, comment }),
	});

	if (!res.ok) {
		const error = await res.json().catch(() => ({ message: 'Comment failed' }));
		throw new Error(error.message || 'Failed to submit comment');
	}

	return res.json();
}

/**
 * Get approved comments for a software
 */
export async function getComments(softwareId: string): Promise<any[]> {
	const res = await fetch(`${API_URL}/api/comments/${softwareId}`);

	if (!res.ok) {
		return [];
	}

	return res.json();
}
