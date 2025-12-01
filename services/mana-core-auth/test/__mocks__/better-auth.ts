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
const createMockApi = () => ({
	// Auth endpoints
	signUpEmail: jest.fn().mockResolvedValue({
		data: {
			user: {
				id: 'mock-user-id',
				email: 'mock@example.com',
				name: 'Mock User',
				role: 'user',
				createdAt: new Date(),
			},
			session: {
				token: 'mock-session-token',
				expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
			},
		},
	}),

	signInEmail: jest.fn().mockResolvedValue({
		data: {
			user: {
				id: 'mock-user-id',
				email: 'mock@example.com',
				name: 'Mock User',
				role: 'user',
			},
			session: {
				token: 'mock-session-token',
				expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
			},
		},
	}),

	signOut: jest.fn().mockResolvedValue({ success: true }),

	// Organization endpoints
	createOrganization: jest.fn().mockResolvedValue({
		data: {
			id: 'mock-org-id',
			name: 'Mock Organization',
			slug: 'mock-organization',
			createdAt: new Date(),
		},
	}),

	listOrganizations: jest.fn().mockResolvedValue({
		data: [],
	}),

	inviteMember: jest.fn().mockResolvedValue({
		data: {
			id: 'mock-invitation-id',
			email: 'invitee@example.com',
			role: 'member',
			status: 'pending',
			expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
		},
	}),

	acceptInvitation: jest.fn().mockResolvedValue({
		data: {
			id: 'mock-member-id',
			organizationId: 'mock-org-id',
			userId: 'mock-user-id',
			role: 'member',
		},
	}),

	listOrganizationMembers: jest.fn().mockResolvedValue({
		data: [],
	}),

	removeMember: jest.fn().mockResolvedValue({ success: true }),

	setActiveOrganization: jest.fn().mockResolvedValue({
		data: {
			session: {
				activeOrganizationId: 'mock-org-id',
			},
		},
	}),

	getActiveOrganization: jest.fn().mockResolvedValue({
		data: null,
	}),
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
