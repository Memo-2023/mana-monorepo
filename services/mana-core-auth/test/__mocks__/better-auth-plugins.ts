/**
 * Mock implementation of better-auth plugins for tests
 */

// Mock JWT plugin
export const jwt = jest.fn((config?: Record<string, unknown>) => ({
	id: 'jwt',
	name: 'JWT Plugin',
	config,
}));

// Mock Organization plugin
export const organization = jest.fn((config?: Record<string, unknown>) => ({
	id: 'organization',
	name: 'Organization Plugin',
	config,
	// Default roles
	organizationRole: config?.organizationRole || {
		owner: { permissions: ['all'] },
		admin: { permissions: ['invite', 'manage_members'] },
		member: { permissions: ['view'] },
	},
}));

// Mock types for organization plugin
export interface Organization {
	id: string;
	name: string;
	slug: string;
	logo?: string | null;
	metadata?: Record<string, unknown>;
	createdAt: Date;
}

export interface Member {
	id: string;
	organizationId: string;
	userId: string;
	role: string;
	createdAt: Date;
}

export interface Invitation {
	id: string;
	organizationId: string;
	email: string;
	role: string;
	status: string;
	expiresAt: Date;
	inviterId: string;
	createdAt: Date;
}

export type OrganizationRole = 'owner' | 'admin' | 'member';
export type InvitationStatus = 'pending' | 'accepted' | 'rejected' | 'canceled';

// Export all plugins
export default {
	jwt,
	organization,
};
