import { Ionicons, MaterialIcons, FontAwesome5 } from '@expo/vector-icons';
import { Link } from 'expo-router';
import { Drawer } from 'expo-router/drawer';

import { HeaderButton } from '../../components/HeaderButton';
import { useTheme } from '~/utils/themeContext';

const DrawerLayout = () => {
	const { isDarkMode } = useTheme();

	return (
		<Drawer
			screenOptions={{
				headerStyle: {
					backgroundColor: isDarkMode ? '#121212' : '#FFFFFF',
				},
				headerTintColor: isDarkMode ? '#F9FAFB' : '#1F2937',
				drawerStyle: {
					backgroundColor: isDarkMode ? '#1E1E1E' : '#FFFFFF',
				},
				drawerActiveTintColor: '#0055FF',
				drawerInactiveTintColor: isDarkMode ? '#9CA3AF' : '#6B7280',
			}}
		>
			<Drawer.Screen
				name="index"
				options={{
					headerTitle: 'Home',
					drawerLabel: 'Home',
					drawerIcon: ({ size, color }) => (
						<Ionicons name="home-outline" size={size} color={color} />
					),
				}}
			/>
			<Drawer.Screen
				name="(tabs)"
				options={{
					headerTitle: 'Tabs',
					drawerLabel: 'Tabs',
					drawerIcon: ({ size, color }) => (
						<MaterialIcons name="border-bottom" size={size} color={color} />
					),
					headerRight: () => (
						<Link href="/modal" asChild>
							<HeaderButton />
						</Link>
					),
				}}
			/>
			<Drawer.Screen
				name="send-mana"
				options={{
					headerTitle: 'Mana senden',
					drawerLabel: 'Mana senden',
					drawerIcon: ({ size, color }) => (
						<FontAwesome5 name="hand-holding-heart" size={size} color={color} />
					),
				}}
			/>
			<Drawer.Screen
				name="get-mana"
				options={{
					headerTitle: 'Mana erhalten',
					drawerLabel: 'Mana erhalten',
					drawerIcon: ({ size, color }) => (
						<FontAwesome5 name="shopping-cart" size={size} color={color} />
					),
				}}
			/>
			<Drawer.Screen
				name="apps"
				options={{
					headerTitle: 'Apps',
					drawerLabel: 'Apps',
					drawerIcon: ({ size, color }) => <FontAwesome5 name="rocket" size={size} color={color} />,
				}}
			/>
			<Drawer.Screen
				name="organizations/index"
				options={{
					headerTitle: 'Organisationen',
					drawerLabel: 'Organisationen',
					drawerIcon: ({ size, color }) => (
						<FontAwesome5 name="building" size={size} color={color} />
					),
				}}
			/>
			<Drawer.Screen
				name="teams/index"
				options={{
					headerTitle: 'Teams',
					drawerLabel: 'Teams',
					drawerIcon: ({ size, color }) => <FontAwesome5 name="users" size={size} color={color} />,
				}}
			/>
			<Drawer.Screen
				name="settings"
				options={{
					headerTitle: 'Einstellungen',
					drawerLabel: 'Einstellungen',
					drawerIcon: ({ size, color }) => (
						<Ionicons name="settings-outline" size={size} color={color} />
					),
				}}
			/>
		</Drawer>
	);
};

export default DrawerLayout;
