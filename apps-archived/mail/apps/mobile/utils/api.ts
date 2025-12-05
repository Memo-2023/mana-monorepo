const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL || 'http://localhost:3017';

interface ApiResponse<T> {
	data?: T;
	error?: { message: string; statusCode?: number };
}

export async function fetchApi<T>(
	endpoint: string,
	options: RequestInit & { token?: string } = {}
): Promise<ApiResponse<T>> {
	const { token, ...fetchOptions } = options;

	const headers: HeadersInit = {
		'Content-Type': 'application/json',
		...fetchOptions.headers,
	};

	if (token) {
		headers['Authorization'] = `Bearer ${token}`;
	}

	try {
		const response = await fetch(`${BACKEND_URL}/api/v1${endpoint}`, {
			...fetchOptions,
			headers,
		});

		if (!response.ok) {
			const errorData = await response.json().catch(() => ({}));
			return {
				error: {
					message: errorData.message || `HTTP error ${response.status}`,
					statusCode: response.status,
				},
			};
		}

		const data = await response.json();
		return { data };
	} catch (error: any) {
		return {
			error: {
				message: error.message || 'Network error',
			},
		};
	}
}

// Email Account API
export const accountsApi = {
	list: (token: string) => fetchApi<{ accounts: any[] }>('/accounts', { token }),
	get: (id: string, token: string) => fetchApi<{ account: any }>(`/accounts/${id}`, { token }),
	create: (data: any, token: string) =>
		fetchApi<{ account: any }>('/accounts', { method: 'POST', body: JSON.stringify(data), token }),
	update: (id: string, data: any, token: string) =>
		fetchApi<{ account: any }>(`/accounts/${id}`, {
			method: 'PATCH',
			body: JSON.stringify(data),
			token,
		}),
	delete: (id: string, token: string) =>
		fetchApi<void>(`/accounts/${id}`, { method: 'DELETE', token }),
	sync: (id: string, token: string) =>
		fetchApi<{ success: boolean }>(`/accounts/${id}/sync`, { method: 'POST', token }),
	setDefault: (id: string, token: string) =>
		fetchApi<{ account: any }>(`/accounts/${id}/default`, { method: 'POST', token }),
};

// Folders API
export const foldersApi = {
	list: (accountId: string, token: string) =>
		fetchApi<{ folders: any[] }>(`/folders?accountId=${accountId}`, { token }),
	get: (id: string, token: string) => fetchApi<{ folder: any }>(`/folders/${id}`, { token }),
};

// Emails API
export const emailsApi = {
	list: (
		params: { accountId?: string; folderId?: string; page?: number; limit?: number },
		token: string
	) => {
		const searchParams = new URLSearchParams();
		if (params.accountId) searchParams.set('accountId', params.accountId);
		if (params.folderId) searchParams.set('folderId', params.folderId);
		if (params.page) searchParams.set('page', String(params.page));
		if (params.limit) searchParams.set('limit', String(params.limit));
		return fetchApi<{ emails: any[]; total: number; page: number; limit: number }>(
			`/emails?${searchParams.toString()}`,
			{ token }
		);
	},
	get: (id: string, token: string) => fetchApi<{ email: any }>(`/emails/${id}`, { token }),
	update: (id: string, data: { isRead?: boolean; isStarred?: boolean }, token: string) =>
		fetchApi<{ email: any }>(`/emails/${id}`, {
			method: 'PATCH',
			body: JSON.stringify(data),
			token,
		}),
	delete: (id: string, token: string) =>
		fetchApi<void>(`/emails/${id}`, { method: 'DELETE', token }),
	move: (id: string, folderId: string, token: string) =>
		fetchApi<{ email: any }>(`/emails/${id}/move`, {
			method: 'POST',
			body: JSON.stringify({ folderId }),
			token,
		}),
	search: (query: string, accountId: string | undefined, token: string) => {
		const searchParams = new URLSearchParams({ q: query });
		if (accountId) searchParams.set('accountId', accountId);
		return fetchApi<{ emails: any[] }>(`/emails/search?${searchParams.toString()}`, { token });
	},
};

// Compose/Drafts API
export const composeApi = {
	listDrafts: (accountId: string | undefined, token: string) => {
		const params = accountId ? `?accountId=${accountId}` : '';
		return fetchApi<{ drafts: any[] }>(`/drafts${params}`, { token });
	},
	getDraft: (id: string, token: string) => fetchApi<{ draft: any }>(`/drafts/${id}`, { token }),
	createDraft: (data: any, token: string) =>
		fetchApi<{ draft: any }>('/drafts', { method: 'POST', body: JSON.stringify(data), token }),
	updateDraft: (id: string, data: any, token: string) =>
		fetchApi<{ draft: any }>(`/drafts/${id}`, {
			method: 'PATCH',
			body: JSON.stringify(data),
			token,
		}),
	deleteDraft: (id: string, token: string) =>
		fetchApi<void>(`/drafts/${id}`, { method: 'DELETE', token }),
	sendDraft: (id: string, token: string) =>
		fetchApi<{ success: boolean }>(`/drafts/${id}/send`, { method: 'POST', token }),
	send: (data: any, token: string) =>
		fetchApi<{ success: boolean }>('/send', { method: 'POST', body: JSON.stringify(data), token }),
	createReply: (emailId: string, token: string) =>
		fetchApi<{ draft: any }>(`/emails/${emailId}/reply`, { method: 'POST', token }),
	createReplyAll: (emailId: string, token: string) =>
		fetchApi<{ draft: any }>(`/emails/${emailId}/reply-all`, { method: 'POST', token }),
	createForward: (emailId: string, token: string) =>
		fetchApi<{ draft: any }>(`/emails/${emailId}/forward`, { method: 'POST', token }),
};

// Labels API
export const labelsApi = {
	list: (token: string) => fetchApi<{ labels: any[] }>('/labels', { token }),
	create: (data: { name: string; color: string }, token: string) =>
		fetchApi<{ label: any }>('/labels', { method: 'POST', body: JSON.stringify(data), token }),
	update: (id: string, data: { name?: string; color?: string }, token: string) =>
		fetchApi<{ label: any }>(`/labels/${id}`, {
			method: 'PATCH',
			body: JSON.stringify(data),
			token,
		}),
	delete: (id: string, token: string) =>
		fetchApi<void>(`/labels/${id}`, { method: 'DELETE', token }),
	addToEmail: (emailId: string, labelIds: string[], token: string) =>
		fetchApi<void>(`/labels/email/${emailId}/add`, {
			method: 'POST',
			body: JSON.stringify({ labelIds }),
			token,
		}),
	removeFromEmail: (emailId: string, labelIds: string[], token: string) =>
		fetchApi<void>(`/labels/email/${emailId}/remove`, {
			method: 'POST',
			body: JSON.stringify({ labelIds }),
			token,
		}),
};
