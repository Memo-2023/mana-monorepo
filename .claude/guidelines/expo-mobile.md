# Expo Mobile Guidelines

## Overview

All mobile applications use **Expo SDK 52+** with **React Native** and **Expo Router** for file-based routing. Styling uses **NativeWind** (Tailwind for React Native).

## Project Structure

```
apps/{project}/apps/mobile/
├── app/
│   ├── _layout.tsx           # Root layout (Stack)
│   ├── index.tsx             # Home screen
│   ├── (auth)/               # Auth screens
│   │   ├── _layout.tsx
│   │   ├── login.tsx
│   │   └── register.tsx
│   ├── (drawer)/             # Main app with drawer
│   │   ├── _layout.tsx
│   │   └── (tabs)/
│   │       ├── _layout.tsx
│   │       ├── home.tsx
│   │       ├── files.tsx
│   │       └── settings.tsx
│   └── file/[id].tsx         # Dynamic route
├── components/
│   ├── ui/                   # Reusable UI components
│   ├── layout/               # Layout components
│   └── {feature}/            # Feature components
├── context/
│   └── AuthProvider.tsx      # Auth context
├── hooks/
│   ├── useAuth.ts
│   └── useFiles.ts
├── services/
│   └── api.ts                # API client
├── lib/
│   └── utils.ts              # Utilities
├── types/
│   └── index.ts
├── assets/                   # Images, fonts
├── app.json                  # Expo config
├── tailwind.config.js        # NativeWind config
├── babel.config.js
└── package.json
```

## App Entry Point

```tsx
// app/_layout.tsx
import { Stack } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { AuthProvider } from '../context/AuthProvider';
import { ThemeProvider } from '../context/ThemeProvider';
import '../global.css'; // NativeWind styles

export default function RootLayout() {
	return (
		<GestureHandlerRootView style={{ flex: 1 }}>
			<ThemeProvider>
				<AuthProvider>
					<Stack screenOptions={{ headerShown: false }}>
						<Stack.Screen name="(auth)" />
						<Stack.Screen name="(drawer)" />
						<Stack.Screen name="modal" options={{ presentation: 'modal' }} />
					</Stack>
				</AuthProvider>
			</ThemeProvider>
		</GestureHandlerRootView>
	);
}
```

## Navigation

### Drawer Navigation

```tsx
// app/(drawer)/_layout.tsx
import { Drawer } from 'expo-router/drawer';
import CustomDrawer from '../../components/layout/CustomDrawer';

export default function DrawerLayout() {
	return (
		<Drawer
			drawerContent={(props) => <CustomDrawer {...props} />}
			screenOptions={{
				drawerType: 'front',
				headerShown: false,
			}}
		>
			<Drawer.Screen name="(tabs)" options={{ title: 'Home' }} />
			<Drawer.Screen name="settings" options={{ title: 'Settings' }} />
		</Drawer>
	);
}
```

### Tab Navigation

```tsx
// app/(drawer)/(tabs)/_layout.tsx
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function TabLayout() {
	return (
		<Tabs
			screenOptions={{
				tabBarActiveTintColor: '#0A84FF',
				headerShown: false,
			}}
		>
			<Tabs.Screen
				name="home"
				options={{
					title: 'Home',
					tabBarIcon: ({ color, size }) => <Ionicons name="home" size={size} color={color} />,
				}}
			/>
			<Tabs.Screen
				name="files"
				options={{
					title: 'Files',
					tabBarIcon: ({ color, size }) => <Ionicons name="folder" size={size} color={color} />,
				}}
			/>
			<Tabs.Screen
				name="settings"
				options={{
					title: 'Settings',
					tabBarIcon: ({ color, size }) => <Ionicons name="settings" size={size} color={color} />,
				}}
			/>
		</Tabs>
	);
}
```

### Programmatic Navigation

```tsx
import { router } from 'expo-router';

// Navigate to route
router.push('/files');
router.push('/file/123');

// Navigate with params
router.push({ pathname: '/file/[id]', params: { id: '123' } });

// Replace (no back)
router.replace('/home');

// Go back
router.back();

// Navigate to modal
router.push('/modal');
```

## Auth Context

```tsx
// context/AuthProvider.tsx
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import * as SecureStore from 'expo-secure-store';
import { router } from 'expo-router';
import { api } from '../services/api';

interface User {
	id: string;
	email: string;
	name: string;
}

interface AuthContextType {
	user: User | null;
	token: string | null;
	loading: boolean;
	login: (email: string, password: string) => Promise<boolean>;
	logout: () => Promise<void>;
	isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const TOKEN_KEY = 'auth_token';
const USER_KEY = 'auth_user';

export function AuthProvider({ children }: { children: ReactNode }) {
	const [user, setUser] = useState<User | null>(null);
	const [token, setToken] = useState<string | null>(null);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		loadStoredAuth();
	}, []);

	async function loadStoredAuth() {
		try {
			const storedToken = await SecureStore.getItemAsync(TOKEN_KEY);
			const storedUser = await SecureStore.getItemAsync(USER_KEY);

			if (storedToken && storedUser) {
				setToken(storedToken);
				setUser(JSON.parse(storedUser));
			}
		} catch (error) {
			console.error('Failed to load auth:', error);
		} finally {
			setLoading(false);
		}
	}

	async function login(email: string, password: string): Promise<boolean> {
		const result = await api.auth.login({ email, password });

		if (!result.ok) {
			return false;
		}

		const { token: newToken, user: newUser } = result.data;

		await SecureStore.setItemAsync(TOKEN_KEY, newToken);
		await SecureStore.setItemAsync(USER_KEY, JSON.stringify(newUser));

		setToken(newToken);
		setUser(newUser);

		return true;
	}

	async function logout() {
		await SecureStore.deleteItemAsync(TOKEN_KEY);
		await SecureStore.deleteItemAsync(USER_KEY);

		setToken(null);
		setUser(null);

		router.replace('/login');
	}

	return (
		<AuthContext.Provider
			value={{
				user,
				token,
				loading,
				login,
				logout,
				isAuthenticated: !!token,
			}}
		>
			{children}
		</AuthContext.Provider>
	);
}

export function useAuth() {
	const context = useContext(AuthContext);
	if (context === undefined) {
		throw new Error('useAuth must be used within an AuthProvider');
	}
	return context;
}
```

## Custom Hooks

### Data Fetching Hook

```tsx
// hooks/useFiles.ts
import { useState, useCallback, useEffect } from 'react';
import { api } from '../services/api';
import type { File, AppError } from '../types';

interface UseFilesResult {
	files: File[];
	loading: boolean;
	error: AppError | null;
	loadFiles: (folderId?: string) => Promise<void>;
	deleteFile: (id: string) => Promise<boolean>;
	refresh: () => Promise<void>;
}

export function useFiles(initialFolderId?: string): UseFilesResult {
	const [files, setFiles] = useState<File[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<AppError | null>(null);
	const [folderId, setFolderId] = useState(initialFolderId);

	const loadFiles = useCallback(
		async (newFolderId?: string) => {
			const targetFolderId = newFolderId ?? folderId;
			setFolderId(targetFolderId);
			setLoading(true);
			setError(null);

			const result = await api.files.list(targetFolderId);

			if (result.ok) {
				setFiles(result.data);
			} else {
				setError(result.error);
			}

			setLoading(false);
		},
		[folderId]
	);

	const deleteFile = useCallback(async (id: string): Promise<boolean> => {
		const result = await api.files.delete(id);

		if (result.ok) {
			setFiles((prev) => prev.filter((f) => f.id !== id));
			return true;
		}

		setError(result.error);
		return false;
	}, []);

	const refresh = useCallback(() => loadFiles(), [loadFiles]);

	useEffect(() => {
		loadFiles();
	}, []);

	return { files, loading, error, loadFiles, deleteFile, refresh };
}
```

### Mutation Hook

```tsx
// hooks/useCreateFile.ts
import { useState, useCallback } from 'react';
import { api } from '../services/api';
import type { File, CreateFileDto, AppError } from '../types';

interface UseCreateFileResult {
	create: (data: CreateFileDto) => Promise<File | null>;
	loading: boolean;
	error: AppError | null;
}

export function useCreateFile(): UseCreateFileResult {
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<AppError | null>(null);

	const create = useCallback(async (data: CreateFileDto): Promise<File | null> => {
		setLoading(true);
		setError(null);

		const result = await api.files.create(data);

		setLoading(false);

		if (result.ok) {
			return result.data;
		}

		setError(result.error);
		return null;
	}, []);

	return { create, loading, error };
}
```

## API Client

```typescript
// services/api.ts
import * as SecureStore from 'expo-secure-store';
import Constants from 'expo-constants';
import type { Result, AppError } from '@manacore/shared-errors';
import { ErrorCode } from '@manacore/shared-errors';

const API_URL = Constants.expoConfig?.extra?.apiUrl ?? 'http://localhost:3016';
const TOKEN_KEY = 'auth_token';

interface ApiResponse<T> {
	ok: boolean;
	data?: T;
	error?: AppError;
}

async function getToken(): Promise<string | null> {
	try {
		return await SecureStore.getItemAsync(TOKEN_KEY);
	} catch {
		return null;
	}
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<Result<T>> {
	try {
		const token = await getToken();

		const response = await fetch(`${API_URL}${endpoint}`, {
			...options,
			headers: {
				'Content-Type': 'application/json',
				...(token ? { Authorization: `Bearer ${token}` } : {}),
				...options.headers,
			},
		});

		const json: ApiResponse<T> = await response.json();

		if (!json.ok || json.error) {
			return {
				ok: false,
				error: json.error ?? { code: ErrorCode.UNKNOWN_ERROR, message: 'Request failed' },
			};
		}

		return { ok: true, data: json.data as T };
	} catch (error) {
		return {
			ok: false,
			error: { code: ErrorCode.EXTERNAL_SERVICE_ERROR, message: 'Network error' },
		};
	}
}

export const api = {
	auth: {
		login: (data: { email: string; password: string }) =>
			request<{ token: string; user: User }>('/api/v1/auth/login', {
				method: 'POST',
				body: JSON.stringify(data),
			}),

		register: (data: { email: string; password: string; name: string }) =>
			request<{ token: string; user: User }>('/api/v1/auth/register', {
				method: 'POST',
				body: JSON.stringify(data),
			}),
	},

	files: {
		list: (folderId?: string) =>
			request<File[]>(`/api/v1/files${folderId ? `?folderId=${folderId}` : ''}`),

		get: (id: string) => request<File>(`/api/v1/files/${id}`),

		create: (data: CreateFileDto) =>
			request<File>('/api/v1/files', {
				method: 'POST',
				body: JSON.stringify(data),
			}),

		delete: (id: string) => request<void>(`/api/v1/files/${id}`, { method: 'DELETE' }),
	},
};
```

## Components

### Screen Component

```tsx
// app/(drawer)/(tabs)/files.tsx
import { View, FlatList, RefreshControl } from 'react-native';
import { useFiles } from '../../../hooks/useFiles';
import { FileCard } from '../../../components/files/FileCard';
import { LoadingSpinner } from '../../../components/ui/LoadingSpinner';
import { ErrorView } from '../../../components/ui/ErrorView';
import { EmptyState } from '../../../components/ui/EmptyState';

export default function FilesScreen() {
	const { files, loading, error, refresh } = useFiles();

	if (loading && files.length === 0) {
		return <LoadingSpinner />;
	}

	if (error) {
		return <ErrorView message={error.message} onRetry={refresh} />;
	}

	return (
		<View className="flex-1 bg-background">
			<FlatList
				data={files}
				keyExtractor={(item) => item.id}
				renderItem={({ item }) => <FileCard file={item} />}
				refreshControl={<RefreshControl refreshing={loading} onRefresh={refresh} />}
				ListEmptyComponent={
					<EmptyState title="No files" description="Upload your first file to get started" />
				}
				contentContainerStyle={{ padding: 16, gap: 12 }}
			/>
		</View>
	);
}
```

### Reusable Component

```tsx
// components/files/FileCard.tsx
import { View, Text, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import type { File } from '../../types';
import { formatBytes, formatDate } from '../../lib/utils';

interface FileCardProps {
	file: File;
	onDelete?: () => void;
}

export function FileCard({ file, onDelete }: FileCardProps) {
	const handlePress = () => {
		router.push({ pathname: '/file/[id]', params: { id: file.id } });
	};

	return (
		<Pressable
			onPress={handlePress}
			className="bg-card rounded-xl p-4 border border-border active:opacity-80"
		>
			<View className="flex-row items-center gap-3">
				<View className="w-10 h-10 bg-primary/10 rounded-lg items-center justify-center">
					<Ionicons name="document" size={20} color="#0A84FF" />
				</View>

				<View className="flex-1">
					<Text className="font-medium text-foreground" numberOfLines={1}>
						{file.name}
					</Text>
					<Text className="text-sm text-muted-foreground">
						{formatBytes(file.size)} • {formatDate(file.createdAt)}
					</Text>
				</View>

				{onDelete && (
					<Pressable
						onPress={onDelete}
						className="p-2"
						hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
					>
						<Ionicons name="trash-outline" size={20} color="#FF3B30" />
					</Pressable>
				)}
			</View>
		</Pressable>
	);
}
```

### UI Component

```tsx
// components/ui/Button.tsx
import { Pressable, Text, ActivityIndicator, PressableProps } from 'react-native';
import { cva, type VariantProps } from 'class-variance-authority';

const buttonVariants = cva('flex-row items-center justify-center rounded-xl', {
	variants: {
		variant: {
			primary: 'bg-primary',
			secondary: 'bg-secondary',
			outline: 'border border-border bg-transparent',
			ghost: 'bg-transparent',
		},
		size: {
			sm: 'h-9 px-3',
			md: 'h-11 px-4',
			lg: 'h-14 px-6',
		},
	},
	defaultVariants: {
		variant: 'primary',
		size: 'md',
	},
});

const textVariants = cva('font-medium', {
	variants: {
		variant: {
			primary: 'text-white',
			secondary: 'text-secondary-foreground',
			outline: 'text-foreground',
			ghost: 'text-foreground',
		},
		size: {
			sm: 'text-sm',
			md: 'text-base',
			lg: 'text-lg',
		},
	},
	defaultVariants: {
		variant: 'primary',
		size: 'md',
	},
});

interface ButtonProps extends PressableProps, VariantProps<typeof buttonVariants> {
	children: string;
	loading?: boolean;
}

export function Button({
	children,
	variant,
	size,
	loading = false,
	disabled,
	className,
	...props
}: ButtonProps) {
	return (
		<Pressable
			disabled={disabled || loading}
			className={`${buttonVariants({ variant, size })} ${disabled ? 'opacity-50' : ''} ${className}`}
			{...props}
		>
			{loading ? (
				<ActivityIndicator color={variant === 'primary' ? '#fff' : '#000'} />
			) : (
				<Text className={textVariants({ variant, size })}>{children}</Text>
			)}
		</Pressable>
	);
}
```

## NativeWind Setup

### Configuration

```javascript
// tailwind.config.js
module.exports = {
	content: ['./app/**/*.{js,ts,tsx}', './components/**/*.{js,ts,tsx}'],
	presets: [require('nativewind/preset')],
	theme: {
		extend: {
			colors: {
				primary: '#0A84FF',
				secondary: '#5856D6',
				background: '#F2F2F7',
				foreground: '#1C1C1E',
				card: '#FFFFFF',
				border: '#E5E5EA',
				muted: '#8E8E93',
				'muted-foreground': '#8E8E93',
			},
		},
	},
};
```

### Usage

```tsx
// NativeWind uses className prop
<View className="flex-1 bg-background p-4">
  <Text className="text-lg font-bold text-foreground">Title</Text>
  <Text className="text-muted-foreground">Subtitle</Text>
</View>

// Conditional classes
<View className={`p-4 rounded-xl ${selected ? 'bg-primary' : 'bg-card'}`}>

// Dynamic classes
<Text className={`text-${size} font-${weight}`}>

// Platform-specific (use Platform.select for complex cases)
<View className="ios:pt-12 android:pt-4">
```

## Form Handling

```tsx
// app/(auth)/login.tsx
import { useState } from 'react';
import { View, Text, TextInput, Alert } from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '../../context/AuthProvider';
import { Button } from '../../components/ui/Button';

export default function LoginScreen() {
	const { login } = useAuth();
	const [email, setEmail] = useState('');
	const [password, setPassword] = useState('');
	const [loading, setLoading] = useState(false);

	async function handleLogin() {
		if (!email.trim() || !password) {
			Alert.alert('Error', 'Please fill in all fields');
			return;
		}

		setLoading(true);
		const success = await login(email.trim(), password);
		setLoading(false);

		if (success) {
			router.replace('/');
		} else {
			Alert.alert('Error', 'Invalid email or password');
		}
	}

	return (
		<View className="flex-1 bg-background p-6 justify-center">
			<Text className="text-3xl font-bold text-foreground mb-8 text-center">Welcome Back</Text>

			<View className="gap-4">
				<View>
					<Text className="text-sm font-medium text-muted-foreground mb-1">Email</Text>
					<TextInput
						value={email}
						onChangeText={setEmail}
						placeholder="you@example.com"
						keyboardType="email-address"
						autoCapitalize="none"
						className="h-12 px-4 bg-card border border-border rounded-xl text-foreground"
					/>
				</View>

				<View>
					<Text className="text-sm font-medium text-muted-foreground mb-1">Password</Text>
					<TextInput
						value={password}
						onChangeText={setPassword}
						placeholder="••••••••"
						secureTextEntry
						className="h-12 px-4 bg-card border border-border rounded-xl text-foreground"
					/>
				</View>

				<Button onPress={handleLogin} loading={loading} className="mt-4">
					Sign In
				</Button>
			</View>
		</View>
	);
}
```

## Environment Variables

```typescript
// Access via Expo Constants
import Constants from 'expo-constants';

const API_URL = Constants.expoConfig?.extra?.apiUrl;

// app.json / app.config.js
{
  "expo": {
    "extra": {
      "apiUrl": process.env.EXPO_PUBLIC_API_URL
    }
  }
}

// .env
EXPO_PUBLIC_API_URL=http://localhost:3016
EXPO_PUBLIC_MANA_CORE_AUTH_URL=http://localhost:3001
```

## Best Practices

### Do's

1. **Use Expo Router** for navigation (file-based)
2. **Use NativeWind** for styling (consistent with web)
3. **Use SecureStore** for sensitive data (tokens)
4. **Create custom hooks** for data fetching
5. **Use TypeScript** with strict mode

### Don'ts

1. **Don't use inline styles** - use NativeWind classes
2. **Don't store tokens in AsyncStorage** - use SecureStore
3. **Don't make API calls in render** - use effects/hooks
4. **Don't ignore loading states** - always show feedback
5. **Don't forget error handling** - handle all error cases
