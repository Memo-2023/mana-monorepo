import { Link, Tabs } from 'expo-router';
import { useTheme } from '../../utils/ThemeContext';
import { Platform, StyleSheet } from 'react-native';
import { BlurView } from 'expo-blur';

import { Header } from '../../components/Header';
import { TabBarIcon } from '../../components/TabBarIcon';

export default function TabLayout() {
	const { theme, isDark } = useTheme();

	// Bestimme die Intensität des Blur-Effekts basierend auf dem Theme
	const blurIntensity = isDark ? 80 : 60;
	const blurTint = isDark ? 'dark' : 'light';

	return (
		<Tabs
			screenOptions={{
				tabBarActiveTintColor: theme.colors.primary,
				tabBarInactiveTintColor: isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)',
				tabBarStyle: {
					position: 'absolute',
					backgroundColor:
						Platform.OS === 'ios'
							? 'transparent'
							: isDark
								? 'rgba(30,30,30,0.7)'
								: 'rgba(255,255,255,0.7)',
					borderTopColor: 'transparent',
					elevation: 0,
					height: 60,
				},
				tabBarBackground: () =>
					Platform.OS === 'ios' ? (
						<BlurView tint={blurTint} intensity={blurIntensity} style={StyleSheet.absoluteFill} />
					) : null,
				headerTransparent: true,
				headerStyle: {
					backgroundColor: 'transparent',
				},
				headerBackground: () => (
					<BlurView tint={blurTint} intensity={blurIntensity} style={StyleSheet.absoluteFill} />
				),
				headerTintColor: theme.colors.text,
				headerShadowVisible: false,
				headerTitleStyle: {
					fontWeight: '600',
				},
				// Hide the header completely
				headerShown: false,
			}}
		>
			<Tabs.Screen
				name="index"
				options={{
					title: 'Community',
					tabBarIcon: ({ color, focused }) => (
						<TabBarIcon name="community" color={color} focused={focused} />
					),
					headerRight: () => (
						<Link href="/settings" asChild>
							<Header standalone={true} />
						</Link>
					),
				}}
			/>
			<Tabs.Screen
				name="create"
				options={{
					title: 'Create',
					tabBarIcon: ({ color, focused }) => (
						<TabBarIcon name="create" color={color} focused={focused} />
					),
				}}
			/>
			<Tabs.Screen
				name="shelf"
				options={{
					title: 'Collection',
					tabBarIcon: ({ color, focused }) => (
						<TabBarIcon name="shelf" color={color} focused={focused} />
					),
				}}
			/>
		</Tabs>
	);
}
