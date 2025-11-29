/**
 * User profile data for display in ProfilePage
 */
export interface UserProfile {
	/** User ID */
	id: string;
	/** User email */
	email: string;
	/** Display name (optional) */
	displayName?: string;
	/** First name (optional) */
	firstName?: string;
	/** Last name (optional) */
	lastName?: string;
	/** Avatar URL (optional) */
	avatarUrl?: string;
	/** Account creation date */
	createdAt?: string;
	/** Last login date */
	lastLoginAt?: string;
	/** User role */
	role?: string;
}

/**
 * Profile action handlers
 */
export interface ProfileActions {
	/** Called when user wants to edit profile */
	onEditProfile?: () => void;
	/** Called when user wants to change password */
	onChangePassword?: () => void;
	/** Called when user wants to delete account */
	onDeleteAccount?: () => void;
	/** Called when user wants to logout */
	onLogout?: () => void;
}
