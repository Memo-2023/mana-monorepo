/**
 * Link creation limits and enforcement for different subscription tiers
 */

export interface LinkLimits {
	monthly_limit: number;
	unlimited: boolean;
}

export const TIER_LIMITS: Record<string, LinkLimits> = {
	free: { monthly_limit: 10, unlimited: false },
	pro: { monthly_limit: 300, unlimited: false }, // Monthly Pro
	team: { monthly_limit: 600, unlimited: false }, // Yearly Pro (reusing team status)
	team_plus: { monthly_limit: 600, unlimited: false }, // Could be used for yearly
	cancelled: { monthly_limit: 10, unlimited: false }, // Fallback to free limits
	past_due: { monthly_limit: 10, unlimited: false }, // Fallback to free limits
};

// Special handling for lifetime users (stripe_subscription_id starts with "lifetime_")
export function getUserLimits(user: any): LinkLimits {
	// Lifetime users get unlimited
	if (user.stripe_subscription_id?.startsWith('lifetime_')) {
		return { monthly_limit: 0, unlimited: true };
	}

	// Map subscription status to limits
	const status = user.subscription_status || 'free';

	// For yearly subscribers, we need to detect them differently
	// This could be enhanced with better subscription type tracking
	if (status === 'pro') {
		// Default to monthly limits for now
		// TODO: Implement proper yearly detection
		return TIER_LIMITS.pro;
	}

	return TIER_LIMITS[status] || TIER_LIMITS.free;
}

export async function checkLinkCreationAllowed(
	pb: any,
	userId: string
): Promise<{
	allowed: boolean;
	current_count: number;
	limit: number;
	unlimited: boolean;
	message?: string;
}> {
	try {
		// Get user with current usage
		const user = await pb.collection('users').getOne(userId);
		const limits = getUserLimits(user);

		// Unlimited users can always create
		if (limits.unlimited) {
			return {
				allowed: true,
				current_count: 0,
				limit: 0,
				unlimited: true,
			};
		}

		// Check if we need to reset monthly counter
		const now = new Date();
		const resetDate = user.monthly_reset_date ? new Date(user.monthly_reset_date) : null;

		let currentCount = user.links_created_this_month || 0;

		// Reset counter if it's a new month
		if (!resetDate || resetDate <= now) {
			const nextReset = new Date(now.getFullYear(), now.getMonth() + 1, 1);
			await pb.collection('users').update(userId, {
				links_created_this_month: 0,
				monthly_reset_date: nextReset.toISOString(),
			});
			currentCount = 0;
		}

		const allowed = currentCount < limits.monthly_limit;

		return {
			allowed,
			current_count: currentCount,
			limit: limits.monthly_limit,
			unlimited: false,
			message: allowed
				? undefined
				: `Monatslimit von ${limits.monthly_limit} Links erreicht. Upgrade für mehr Links!`,
		};
	} catch (error) {
		console.error('Error checking link limits:', error);
		// Fail open - allow creation but log error
		return {
			allowed: true,
			current_count: 0,
			limit: 10,
			unlimited: false,
			message: 'Konnte Limits nicht prüfen',
		};
	}
}

export async function incrementLinkCount(pb: any, userId: string): Promise<void> {
	try {
		const user = await pb.collection('users').getOne(userId);
		const currentCount = user.links_created_this_month || 0;

		await pb.collection('users').update(userId, {
			links_created_this_month: currentCount + 1,
		});
	} catch (error) {
		console.error('Error incrementing link count:', error);
		// Don't throw - this shouldn't prevent link creation
	}
}

export function getLimitDisplayInfo(user: any): {
	current: number;
	limit: number;
	unlimited: boolean;
	percentage: number;
	status: 'safe' | 'warning' | 'danger';
} {
	const limits = getUserLimits(user);
	const current = user.links_created_this_month || 0;

	if (limits.unlimited) {
		return {
			current,
			limit: 0,
			unlimited: true,
			percentage: 0,
			status: 'safe',
		};
	}

	const percentage = (current / limits.monthly_limit) * 100;
	let status: 'safe' | 'warning' | 'danger' = 'safe';

	if (percentage >= 100) status = 'danger';
	else if (percentage >= 80) status = 'warning';

	return {
		current,
		limit: limits.monthly_limit,
		unlimited: false,
		percentage,
		status,
	};
}
