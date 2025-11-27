/**
 * Enhanced Tab Layout mit automatischer Native Tabs Detection
 * Nutzt Native Tabs auf iOS 18+ für Liquid Glass Effekt
 * Fallback zu Blur-basierten Tabs auf älteren Versionen
 */

import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { View, Platform } from 'react-native';
import { BlurView } from 'expo-blur';
import { useTranslation } from 'react-i18next';

// Versuche Native Tabs zu laden
let NativeTabLayout: any = null;
const ENABLE_NATIVE_TABS = true; // Setze auf false zum Deaktivieren

if (ENABLE_NATIVE_TABS && Platform.OS === 'ios') {
	try {
		// Prüfe ob Native Tabs verfügbar sind
		const nativeTabsModule = require('expo-router/unstable-native-tabs');
		if (nativeTabsModule && nativeTabsModule.NativeTabs) {
			// Lade unsere Native Tabs Implementation
			NativeTabLayout = require('./NativeTabsLayout').default;
		}
	} catch (error) {}
}

export default function TabLayout() {
	const { t } = useTranslation();

	// Wenn Native Tabs verfügbar sind, nutze sie
	if (NativeTabLayout) {
		return <NativeTabLayout />;
	}

	// Fallback: Enhanced Blur Tabs für ältere iOS Versionen
	const isIOS = Platform.OS === 'ios';

	return (
		<Tabs
			initialRouteName="quotes"
			screenOptions={{
				tabBarActiveTintColor: '#ffffff',
				tabBarInactiveTintColor: '#6b7280',
				tabBarStyle: isIOS
					? {
							// iOS: Transparenter Hintergrund für Blur-Effekt
							position: 'absolute',
							backgroundColor: 'transparent',
							borderTopWidth: 0,
							elevation: 0,
							height: 95,
							paddingTop: 10,
							paddingBottom: 35,
						}
					: {
							// Android: Standard Style
							backgroundColor: '#0f0f0f',
							borderTopColor: '#1a1a1a',
							height: 90,
							paddingTop: 10,
							paddingBottom: 30,
						},
				tabBarBackground: () =>
					isIOS ? (
						<BlurView
							intensity={100}
							tint="dark"
							style={{
								position: 'absolute',
								left: 0,
								right: 0,
								top: 0,
								bottom: 0,
							}}
						/>
					) : null,
				tabBarLabelStyle: {
					fontSize: 12,
					fontWeight: '600',
				},
			}}
		>
			<Tabs.Screen
				name="quotes"
				options={{
					title: t('navigation.quotes'),
					tabBarLabel: t('navigation.quotes'),
					tabBarIcon: ({ color, focused }) => (
						<View>
							{focused && (
								<View
									className="absolute -inset-2 rounded-full bg-white/10"
									style={{ width: 48, height: 48 }}
								/>
							)}
							<Ionicons name={focused ? 'book' : 'book-outline'} size={28} color={color} />
						</View>
					),
				}}
			/>
			<Tabs.Screen
				name="authors"
				options={{
					title: t('navigation.authors'),
					tabBarIcon: ({ color, focused }) => (
						<View>
							{focused && (
								<View
									className="absolute -inset-2 rounded-full bg-white/10"
									style={{ width: 48, height: 48 }}
								/>
							)}
							<Ionicons name={focused ? 'people' : 'people-outline'} size={28} color={color} />
						</View>
					),
				}}
			/>
			<Tabs.Screen
				name="liste"
				options={{
					title: t('lists.lists'),
					tabBarIcon: ({ color, focused }) => (
						<View>
							{focused && (
								<View
									className="absolute -inset-2 rounded-full bg-white/10"
									style={{ width: 48, height: 48 }}
								/>
							)}
							<Ionicons name={focused ? 'list' : 'list-outline'} size={28} color={color} />
						</View>
					),
				}}
			/>
			<Tabs.Screen
				name="myquotes"
				options={{
					title: t('navigation.myQuotes'),
					tabBarIcon: ({ color, focused }) => (
						<View>
							{focused && (
								<View
									className="absolute -inset-2 rounded-full bg-white/10"
									style={{ width: 48, height: 48 }}
								/>
							)}
							<Ionicons name={focused ? 'create' : 'create-outline'} size={28} color={color} />
						</View>
					),
				}}
			/>
			<Tabs.Screen
				name="search"
				options={{
					title: t('navigation.search'),
					tabBarIcon: ({ color, focused }) => (
						<View>
							{focused && (
								<View
									className="absolute -inset-2 rounded-full bg-white/10"
									style={{ width: 48, height: 48 }}
								/>
							)}
							<Ionicons name={focused ? 'search' : 'search-outline'} size={28} color={color} />
						</View>
					),
				}}
			/>
		</Tabs>
	);
}
