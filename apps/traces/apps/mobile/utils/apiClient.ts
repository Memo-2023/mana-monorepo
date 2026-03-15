import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';

const BACKEND_URL =
	Constants.expoConfig?.extra?.EXPO_PUBLIC_TRACES_BACKEND_URL ||
	process.env.EXPO_PUBLIC_TRACES_BACKEND_URL ||
	'http://localhost:3026';

const AUTH_TOKEN_KEY = 'auth_token';

export async function getAuthToken(): Promise<string | null> {
	return AsyncStorage.getItem(AUTH_TOKEN_KEY);
}

export async function setAuthToken(token: string): Promise<void> {
	await AsyncStorage.setItem(AUTH_TOKEN_KEY, token);
}

export async function clearAuthToken(): Promise<void> {
	await AsyncStorage.removeItem(AUTH_TOKEN_KEY);
}

interface FetchOptions extends RequestInit {
	skipAuth?: boolean;
}

export async function apiFetch<T = any>(path: string, options: FetchOptions = {}): Promise<T> {
	const { skipAuth, ...fetchOptions } = options;

	const headers: Record<string, string> = {
		'Content-Type': 'application/json',
		...(fetchOptions.headers as Record<string, string>),
	};

	if (!skipAuth) {
		const token = await getAuthToken();
		if (token) {
			headers['Authorization'] = `Bearer ${token}`;
		}
	}

	const url = `${BACKEND_URL}${path}`;

	const response = await fetch(url, {
		...fetchOptions,
		headers,
	});

	if (!response.ok) {
		const errorBody = await response.text().catch(() => '');
		throw new Error(`API Error ${response.status}: ${errorBody}`);
	}

	return response.json();
}
