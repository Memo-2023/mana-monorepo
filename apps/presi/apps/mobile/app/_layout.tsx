import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { useSegments, useRouter } from 'expo-router';
import { View, TouchableOpacity, Text } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { onAuthStateChange } from '../services/auth';
import { ThemeProvider, useTheme } from '../components/ThemeProvider';
import { Header } from '../components/Menu/Header';

function StackNavigator() {
	const router = useRouter();
	const { theme } = useTheme();

	return (
		<View style={{ flex: 1, backgroundColor: theme.colors.backgroundPage }}>
			<Stack
				screenOptions={{
					header: ({ route, options }) => {
						let title = options.title || '';
						let showAddDeck = false;
						let rightContent = options.headerRight?.({});

						if (route.name === 'index') {
							title = `My Decks (${route.params?.deckCount || 0})`;
							showAddDeck = true;
						}

						return <Header title={title} showAddDeck={showAddDeck} rightContent={rightContent} />;
					},
				}}
			>
				<Stack.Screen
					name="index"
					options={{
						title: 'My Decks',
					}}
				/>
				<Stack.Screen
					name="(auth)"
					options={{
						headerShown: false,
					}}
				/>
				<Stack.Screen
					name="settings"
					options={{
						title: 'Settings',
					}}
				/>
				<Stack.Screen
					name="profile"
					options={{
						title: 'Profile',
					}}
				/>
				<Stack.Screen
					name="decks/[id]"
					options={{
						title: 'Deck Details',
					}}
				/>
				<Stack.Screen
					name="deck/[id]"
					options={{
						headerShown: false,
					}}
				/>
				<Stack.Screen
					name="create-deck"
					options={{
						title: 'Create New Deck',
						presentation: 'modal',
					}}
				/>
				<Stack.Screen
					name="(auth)/login"
					options={{
						title: 'Login',
						headerShown: false,
					}}
				/>
				<Stack.Screen
					name="(auth)/register"
					options={{
						title: 'Register',
						headerShown: false,
					}}
				/>
			</Stack>
		</View>
	);
}

function RootLayoutContent() {
	const { theme } = useTheme();

	return (
		<View style={{ flex: 1, backgroundColor: theme.colors.backgroundPage }}>
			<StackNavigator />
		</View>
	);
}

export default function RootLayout() {
	const segments = useSegments();
	const router = useRouter();

	useEffect(() => {
		const unsubscribe = onAuthStateChange((user) => {
			if (!user && !segments.includes('(auth)')) {
				router.replace('/login');
			}
		});
		return () => {
			unsubscribe();
		};
	}, [segments]);

	return (
		<ThemeProvider>
			<RootLayoutContent />
		</ThemeProvider>
	);
}
