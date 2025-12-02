/**
 * Calendar share permission levels
 */
export type SharePermission = 'read' | 'write' | 'admin';

/**
 * Share invitation status
 */
export type ShareStatus = 'pending' | 'accepted' | 'declined';

/**
 * Calendar share entity
 */
export interface CalendarShare {
	id: string;
	calendarId: string;
	sharedWithUserId?: string | null;
	sharedWithEmail?: string | null;

	// Permission
	permission: SharePermission;

	// Share link (for public/link sharing)
	shareToken?: string | null;
	shareUrl?: string | null;

	// Status
	status: ShareStatus;

	// Metadata
	invitedBy: string;
	acceptedAt?: Date | string | null;
	expiresAt?: Date | string | null;

	createdAt: Date | string;
	updatedAt: Date | string;
}

/**
 * Share with calendar and user details (for display)
 */
export interface CalendarShareWithDetails extends CalendarShare {
	calendar?: {
		id: string;
		name: string;
		color: string;
		userId: string;
	};
	invitedByUser?: {
		id: string;
		email: string;
		name?: string;
	};
	sharedWithUser?: {
		id: string;
		email: string;
		name?: string;
	};
}

/**
 * Data required to share a calendar
 */
export interface CreateShareInput {
	calendarId: string;
	/** Email of user to share with */
	email?: string;
	/** Permission level */
	permission: SharePermission;
	/** Create a shareable link instead of direct share */
	createLink?: boolean;
	/** Optional expiration date */
	expiresAt?: Date | string;
}

/**
 * Data for updating a share
 */
export interface UpdateShareInput {
	permission?: SharePermission;
	expiresAt?: Date | string | null;
}

/**
 * Permission descriptions for UI
 */
export const PERMISSION_DESCRIPTIONS: Record<SharePermission, string> = {
	read: 'Can view events',
	write: 'Can view and edit events',
	admin: 'Can manage calendar settings and shares',
};
