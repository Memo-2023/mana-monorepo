// Polyfill for structuredClone (not available in React Native 0.79.5)
import '../global.css';

import { Stack, router } from 'expo-router';
import { useAuth } from '~/hooks/useAuth';
import { useEffect } from 'react';

if (typeof globalThis.structuredClone === 'undefined') {
	globalThis.structuredClone = (obj: any) => JSON.parse(JSON.stringify(obj));
}

export const unstable_settings = {
	initialRouteName: '(tabs)',
};

export default function RootLayout() {
	const { user, loading } = useAuth();

	useEffect(() => {
		if (!loading) {
			if (user) {
				router.replace('/(tabs)');
			} else {
				router.replace('/(auth)/login');
			}
		}
	}, [user, loading]);

	return (
		<Stack screenOptions={{ headerShown: false }}>
			<Stack.Screen name="(auth)" />
			<Stack.Screen name="(tabs)" />
		</Stack>
	);
}
