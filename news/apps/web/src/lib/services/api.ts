import { env } from '$env/dynamic/public';

const API_URL = env.PUBLIC_NEWS_API_URL || 'http://localhost:3000';

interface ApiResponse<T> {
  data?: T;
  error?: string;
}

export async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {},
  token?: string
): Promise<ApiResponse<T>> {
  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const errorText = await response.text();
      return { error: errorText || `HTTP ${response.status}` };
    }

    const data = await response.json();
    return { data };
  } catch (error) {
    return { error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

// Auth endpoints
export const authApi = {
  login: (email: string, password: string) =>
    apiRequest<{ token: string; user: App.Locals['user'] }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),

  signup: (email: string, password: string, name?: string) =>
    apiRequest<{ token: string; user: App.Locals['user'] }>('/auth/signup', {
      method: 'POST',
      body: JSON.stringify({ email, password, name }),
    }),

  logout: (token: string) =>
    apiRequest('/auth/logout', { method: 'POST' }, token),

  me: (token: string) =>
    apiRequest<App.Locals['user']>('/auth/me', {}, token),
};

// Articles endpoints
export const articlesApi = {
  getArticles: (params?: { type?: string; categoryId?: string; limit?: number; offset?: number }, token?: string) => {
    const searchParams = new URLSearchParams();
    if (params?.type) searchParams.set('type', params.type);
    if (params?.categoryId) searchParams.set('categoryId', params.categoryId);
    if (params?.limit) searchParams.set('limit', params.limit.toString());
    if (params?.offset) searchParams.set('offset', params.offset.toString());
    const query = searchParams.toString();
    return apiRequest<any[]>(`/articles${query ? `?${query}` : ''}`, {}, token);
  },

  getArticle: (id: string, token?: string) =>
    apiRequest<any>(`/articles/${id}`, {}, token),

  getSavedArticles: (token: string) =>
    apiRequest<any[]>('/articles/saved/list', {}, token),

  archiveArticle: (id: string, token: string) =>
    apiRequest(`/articles/${id}/archive`, { method: 'POST' }, token),

  unarchiveArticle: (id: string, token: string) =>
    apiRequest(`/articles/${id}/unarchive`, { method: 'POST' }, token),

  deleteArticle: (id: string, token: string) =>
    apiRequest(`/articles/${id}`, { method: 'DELETE' }, token),
};

// Categories endpoints
export const categoriesApi = {
  getCategories: (token?: string) =>
    apiRequest<any[]>('/categories', {}, token),
};
