import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function TabLayout() {
	return (
		<Tabs
			screenOptions={{
				tabBarActiveTintColor: '#9333ea',
				tabBarInactiveTintColor: '#6b7280',
				headerStyle: {
					backgroundColor: '#9333ea',
				},
				headerTintColor: '#fff',
			}}
		>
			<Tabs.Screen
				name="index"
				options={{
					title: 'Home',
					tabBarIcon: ({ color, size }) => <Ionicons name="home" size={size} color={color} />,
				}}
			/>
			<Tabs.Screen
				name="transcribe"
				options={{
					title: 'Transcribe',
					tabBarIcon: ({ color, size }) => <Ionicons name="mic" size={size} color={color} />,
				}}
			/>
			<Tabs.Screen
				name="transcripts"
				options={{
					title: 'Transcripts',
					tabBarIcon: ({ color, size }) => (
						<Ionicons name="document-text" size={size} color={color} />
					),
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
