import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Environment-based API configuration
const getApiUrl = (): string => {
	if (__DEV__) {
		// Development environment
		return process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3002';
	} else {
		// Production/Staging environment
		return process.env.EXPO_PUBLIC_API_URL || 'https://storyteller-backend-pduya7fsoq-ey.a.run.app';
	}
};

export const API_CONFIG = {
	baseURL: getApiUrl(),
	timeout: 30000,
	headers: {
		'Content-Type': 'application/json',
		Accept: 'application/json',
	},
};

// Token storage keys
const TOKEN_KEY = '@storyteller:auth_token';
const REFRESH_TOKEN_KEY = '@storyteller:refresh_token';

// Token management
export const TokenManager = {
	async getAccessToken(): Promise<string | null> {
		try {
			return await AsyncStorage.getItem(TOKEN_KEY);
		} catch (error) {
			console.error('Error getting access token:', error);
			return null;
		}
	},

	async setAccessToken(token: string): Promise<void> {
		try {
			await AsyncStorage.setItem(TOKEN_KEY, token);
		} catch (error) {
			console.error('Error saving access token:', error);
		}
	},

	async getRefreshToken(): Promise<string | null> {
		try {
			return await AsyncStorage.getItem(REFRESH_TOKEN_KEY);
		} catch (error) {
			console.error('Error getting refresh token:', error);
			return null;
		}
	},

	async setRefreshToken(token: string): Promise<void> {
		try {
			await AsyncStorage.setItem(REFRESH_TOKEN_KEY, token);
		} catch (error) {
			console.error('Error saving refresh token:', error);
		}
	},

	async clearTokens(): Promise<void> {
		try {
			await AsyncStorage.multiRemove([TOKEN_KEY, REFRESH_TOKEN_KEY]);
		} catch (error) {
			console.error('Error clearing tokens:', error);
		}
	},
};

// Create axios instance
const apiClient: AxiosInstance = axios.create(API_CONFIG);

// Request interceptor for authentication
apiClient.interceptors.request.use(
	async (config) => {
		const token = await TokenManager.getAccessToken();
		if (token) {
			config.headers.Authorization = `Bearer ${token}`;
		}

		// Add request ID for tracing
		config.headers['X-Request-ID'] = generateRequestId();

		// Log request in development
		if (__DEV__) {
			console.log(`[API Request] ${config.method?.toUpperCase()} ${config.url}`, {
				params: config.params,
				data: config.data,
			});
		}

		return config;
	},
	(error) => {
		console.error('[API Request Error]', error);
		return Promise.reject(error);
	}
);

// Response interceptor for error handling
apiClient.interceptors.response.use(
	(response) => {
		// Log response in development
		if (__DEV__) {
			console.log(
				`[API Response] ${response.config.method?.toUpperCase()} ${response.config.url}`,
				{
					status: response.status,
					data: response.data,
				}
			);
		}
		return response;
	},
	async (error) => {
		const originalRequest = error.config;

		// Handle 401 Unauthorized - try to refresh token
		if (error.response?.status === 401 && !originalRequest._retry) {
			originalRequest._retry = true;

			try {
				const refreshToken = await TokenManager.getRefreshToken();
				if (refreshToken) {
					const response = await apiClient.post('/auth/refresh', {
						refreshToken,
					});

					const { accessToken, refreshToken: newRefreshToken } = response.data;
					await TokenManager.setAccessToken(accessToken);
					if (newRefreshToken) {
						await TokenManager.setRefreshToken(newRefreshToken);
					}

					// Retry original request with new token
					originalRequest.headers.Authorization = `Bearer ${accessToken}`;
					return apiClient(originalRequest);
				}
			} catch (refreshError) {
				// Refresh failed, clear tokens and redirect to login
				await TokenManager.clearTokens();
				// Emit event or navigate to login screen
				// EventEmitter.emit('auth:logout');
			}
		}

		// Log error details
		if (__DEV__) {
			console.error('[API Error]', {
				url: error.config?.url,
				method: error.config?.method,
				status: error.response?.status,
				data: error.response?.data,
				message: error.message,
			});
		}

		// Format error for app consumption
		const formattedError = {
			message: error.response?.data?.message || error.message || 'An error occurred',
			status: error.response?.status,
			code: error.response?.data?.code,
			details: error.response?.data?.details,
		};

		return Promise.reject(formattedError);
	}
);

// Helper function to generate request ID
function generateRequestId(): string {
	return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

// API service wrapper
export class ApiService {
	private client: AxiosInstance;

	constructor(client: AxiosInstance = apiClient) {
		this.client = client;
	}

	async get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
		const response = await this.client.get<T>(url, config);
		return response.data;
	}

	async post<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
		const response = await this.client.post<T>(url, data, config);
		return response.data;
	}

	async put<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
		const response = await this.client.put<T>(url, data, config);
		return response.data;
	}

	async patch<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
		const response = await this.client.patch<T>(url, data, config);
		return response.data;
	}

	async delete<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
		const response = await this.client.delete<T>(url, config);
		return response.data;
	}

	// Upload file with progress tracking
	async uploadFile(
		url: string,
		file: File | Blob,
		onProgress?: (progress: number) => void
	): Promise<any> {
		const formData = new FormData();
		formData.append('file', file);

		return this.post(url, formData, {
			headers: {
				'Content-Type': 'multipart/form-data',
			},
			onUploadProgress: (progressEvent) => {
				if (onProgress && progressEvent.total) {
					const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
					onProgress(progress);
				}
			},
		});
	}
}

// Export singleton instance
export const api = new ApiService();

// Export axios instance for advanced usage
export { apiClient };
