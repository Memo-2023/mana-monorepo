/**
 * Mock implementation of better-auth for tests
 * This mock allows tests to run without requiring actual Better Auth dependencies
 */

// Mock user type
interface MockUser {
	id: string;
	email: string;
	name?: string;
	role?: string;
	createdAt?: Date;
}

// Mock session type
interface MockSession {
	token: string;
	expiresAt: Date;
	userId: string;
	activeOrganizationId?: string;
	metadata?: Record<string, unknown>;
}

// Mock organization type
interface MockOrganization {
	id: string;
	name: string;
	slug: string;
	logo?: string;
	metadata?: Record<string, unknown>;
	createdAt?: Date;
}

// Mock member type
interface MockMember {
	id: string;
	organizationId: string;
	userId: string;
	role: 'owner' | 'admin' | 'member';
	createdAt?: Date;
}

// Mock invitation type
interface MockInvitation {
	id: string;
	organizationId: string;
	email: string;
	role: string;
	status: 'pending' | 'accepted' | 'rejected' | 'canceled';
	expiresAt: Date;
	inviterId: string;
	createdAt?: Date;
}

// Mock API responses
// Note: Better Auth API returns data directly (not wrapped in { data: ... })
const createMockApi = () => ({
	// Auth endpoints
	signUpEmail: jest.fn().mockResolvedValue({
		user: {
			id: 'mock-user-id',
			email: 'mock@example.com',
			name: 'Mock User',
			role: 'user',
			createdAt: new Date(),
		},
		session: {
			id: 'mock-session-id',
			token: 'mock-session-token',
			expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
		},
	}),

	signInEmail: jest.fn().mockResolvedValue({
		user: {
			id: 'mock-user-id',
			email: 'mock@example.com',
			name: 'Mock User',
			role: 'user',
		},
		session: {
			id: 'mock-session-id',
			token: 'mock-session-token',
			expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
		},
		token: 'mock-access-token',
	}),

	signOut: jest.fn().mockResolvedValue({ success: true }),

	getSession: jest.fn().mockResolvedValue({
		user: {
			id: 'mock-user-id',
			email: 'mock@example.com',
			name: 'Mock User',
			role: 'user',
		},
		session: {
			id: 'mock-session-id',
			token: 'mock-session-token',
			expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
		},
	}),

	// Organization endpoints
	createOrganization: jest.fn().mockResolvedValue({
		id: 'mock-org-id',
		name: 'Mock Organization',
		slug: 'mock-organization',
		createdAt: new Date(),
	}),

	listOrganizations: jest.fn().mockResolvedValue([]),

	inviteMember: jest.fn().mockResolvedValue({
		id: 'mock-invitation-id',
		email: 'invitee@example.com',
		role: 'member',
		status: 'pending',
		expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
	}),

	acceptInvitation: jest.fn().mockResolvedValue({
		member: {
			id: 'mock-member-id',
			organizationId: 'mock-org-id',
			userId: 'mock-user-id',
			role: 'member',
		},
	}),

	getFullOrganization: jest.fn().mockResolvedValue({
		id: 'mock-org-id',
		name: 'Mock Organization',
		slug: 'mock-organization',
		members: [],
	}),

	listOrganizationMembers: jest.fn().mockResolvedValue([]),

	removeMember: jest.fn().mockResolvedValue({ success: true }),

	setActiveOrganization: jest.fn().mockResolvedValue({
		userId: 'mock-user-id',
		activeOrganizationId: 'mock-org-id',
		session: {
			id: 'mock-session-id',
			activeOrganizationId: 'mock-org-id',
		},
	}),

	getActiveOrganization: jest.fn().mockResolvedValue(null),

	// JWT methods
	signJWT: jest.fn().mockResolvedValue({ token: 'mock-jwt-token' }),
	getJwks: jest.fn().mockResolvedValue({ keys: [] }),

	// Password reset methods
	requestPasswordReset: jest.fn().mockResolvedValue({ status: true }),
	resetPassword: jest.fn().mockResolvedValue({ status: true }),
});

// Mock auth instance
export const betterAuth = jest.fn(() => ({
	api: createMockApi(),
	handler: jest.fn(),
}));

// Export mock types for tests
export type { MockUser, MockSession, MockOrganization, MockMember, MockInvitation };

// Export types matching better-auth/types exports
export interface User {
	id: string;
	email: string;
	name: string | null;
	emailVerified: boolean;
	image?: string | null;
	createdAt: Date;
	updatedAt: Date;
}

export interface Session {
	id: string;
	userId: string;
	token: string;
	expiresAt: Date;
	createdAt: Date;
	updatedAt: Date;
	ipAddress?: string | null;
	userAgent?: string | null;
}

// Default export
export default { betterAuth };
