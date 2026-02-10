import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function TabLayout() {
	return (
		<Tabs
			screenOptions={{
				tabBarActiveTintColor: '#6C5CE7',
				tabBarInactiveTintColor: '#B2BEC3',
				tabBarStyle: {
					backgroundColor: '#FFFFFF',
					borderTopColor: '#DFE6E9',
				},
				headerStyle: {
					backgroundColor: '#FFFFFF',
				},
				headerTintColor: '#2D3436',
			}}
		>
			<Tabs.Screen
				name="index"
				options={{
					title: 'Community',
					tabBarIcon: ({ color, size }) => (
						<Ionicons name="globe-outline" size={size} color={color} />
					),
				}}
			/>
			<Tabs.Screen
				name="create"
				options={{
					title: 'Create',
					tabBarIcon: ({ color, size }) => (
						<Ionicons name="add-circle-outline" size={size} color={color} />
					),
				}}
			/>
			<Tabs.Screen
				name="shelf"
				options={{
					title: 'Collection',
					tabBarIcon: ({ color, size }) => (
						<Ionicons name="grid-outline" size={size} color={color} />
					),
				}}
			/>
		</Tabs>
	);
}
