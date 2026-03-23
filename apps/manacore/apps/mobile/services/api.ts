import * as SecureStore from 'expo-secure-store';

const BASE_URL = process.env.EXPO_PUBLIC_MANA_CORE_AUTH_URL || 'http://localhost:3001';

/**
 * API client for mana-core-auth service.
 * Wraps fetch calls and automatically attaches JWT from SecureStore.
 */
class ManaCoreApi {
	private async getToken(): Promise<string | null> {
		try {
			const raw = await SecureStore.getItemAsync('@manacore/app_token');
			if (!raw) return null;
			// The token might be stored as a JSON string
			try {
				const parsed = JSON.parse(raw);
				return typeof parsed === 'string' ? parsed : (parsed?.accessToken ?? raw);
			} catch {
				return raw;
			}
		} catch {
			return null;
		}
	}

	private async request<T>(
		path: string,
		options: RequestInit = {}
	): Promise<{ data: T | null; error: string | null }> {
		try {
			const token = await this.getToken();
			const headers: Record<string, string> = {
				'Content-Type': 'application/json',
				...(options.headers as Record<string, string>),
			};

			if (token) {
				headers['Authorization'] = `Bearer ${token}`;
			}

			const response = await fetch(`${BASE_URL}${path}`, {
				...options,
				headers,
			});

			if (!response.ok) {
				const errorData = await response.json().catch(() => ({}));
				return {
					data: null,
					error: errorData.message || errorData.error || `HTTP ${response.status}`,
				};
			}

			// Handle 204 No Content
			if (response.status === 204) {
				return { data: null, error: null };
			}

			const data = await response.json();
			return { data, error: null };
		} catch (error: any) {
			return {
				data: null,
				error: error.message || 'Netzwerkfehler. Bitte versuchen Sie es später erneut.',
			};
		}
	}

	// ---- Profile ----

	async getProfile() {
		return this.request<{
			id: string;
			email: string;
			name: string;
			image?: string;
			createdAt: string;
		}>('/api/v1/auth/profile');
	}

	async updateProfile(data: { name?: string; image?: string }) {
		return this.request('/api/v1/auth/profile', {
			method: 'POST',
			body: JSON.stringify(data),
		});
	}

	// ---- Organizations ----

	async getOrganizations() {
		return this.request<
			Array<{
				id: string;
				name: string;
				slug: string;
				logo?: string;
				createdAt: string;
				metadata?: Record<string, any>;
			}>
		>('/api/v1/auth/organizations');
	}

	async getOrganization(id: string) {
		return this.request<{
			id: string;
			name: string;
			slug: string;
			logo?: string;
			createdAt: string;
			metadata?: Record<string, any>;
		}>(`/api/v1/auth/organizations/${id}`);
	}

	async createOrganization(data: { name: string; slug?: string }) {
		return this.request('/api/v1/auth/register/b2b', {
			method: 'POST',
			body: JSON.stringify(data),
		});
	}

	async deleteOrganization(id: string) {
		return this.request(`/api/v1/auth/organizations/${id}`, {
			method: 'DELETE',
		});
	}

	// ---- Organization Members ----

	async getOrgMembers(orgId: string) {
		return this.request<
			Array<{
				id: string;
				userId: string;
				email?: string;
				name?: string;
				role: string;
				createdAt: string;
			}>
		>(`/api/v1/auth/organizations/${orgId}/members`);
	}

	async inviteMember(orgId: string, email: string, role: string = 'member') {
		return this.request(`/api/v1/auth/organizations/${orgId}/invite`, {
			method: 'POST',
			body: JSON.stringify({ email, role }),
		});
	}

	async removeMember(orgId: string, memberId: string) {
		return this.request(`/api/v1/auth/organizations/${orgId}/members/${memberId}`, {
			method: 'DELETE',
		});
	}

	async updateMemberRole(orgId: string, memberId: string, role: string) {
		return this.request(`/api/v1/auth/organizations/${orgId}/members/${memberId}/role`, {
			method: 'PATCH',
			body: JSON.stringify({ role }),
		});
	}

	// ---- Credits ----

	async getCreditBalance() {
		return this.request<{
			balance: number;
			totalCredits: number;
			usedCredits: number;
		}>('/api/v1/credits/balance');
	}

	async getCreditTransactions() {
		return this.request<
			Array<{
				id: string;
				amount: number;
				description: string;
				createdAt: string;
				type: string;
			}>
		>('/api/v1/credits/transactions');
	}

	// ---- Invitations ----

	async getInvitations() {
		return this.request<
			Array<{
				id: string;
				organizationId: string;
				organizationName: string;
				email: string;
				role: string;
				status: string;
				expiresAt: string;
			}>
		>('/api/v1/auth/invitations');
	}

	async acceptInvitation(invitationId: string) {
		return this.request('/api/v1/auth/organizations/accept-invitation', {
			method: 'POST',
			body: JSON.stringify({ invitationId }),
		});
	}
}

// Export a singleton instance
export const api = new ManaCoreApi();
