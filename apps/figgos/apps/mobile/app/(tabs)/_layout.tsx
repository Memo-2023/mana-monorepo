import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function TabLayout() {
	return (
		<Tabs
			screenOptions={{
				tabBarActiveTintColor: 'rgb(108, 92, 231)',
				tabBarInactiveTintColor: 'rgb(178, 190, 195)',
				tabBarStyle: {
					backgroundColor: 'rgb(255, 255, 255)',
					borderTopColor: 'rgb(223, 230, 233)',
				},
				headerStyle: {
					backgroundColor: 'rgb(255, 255, 255)',
				},
				headerTintColor: 'rgb(45, 52, 54)',
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
