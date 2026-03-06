import { View, Text } from 'react-native';
import { Tabs } from 'expo-router';
import { ChatCircle, User, Bell, GearSix } from 'phosphor-react-native';
import { useMatrixStore } from '~/src/matrix/store';

const BG = '#0f0f0f';
const BORDER = '#2a2a2a';
const ACTIVE = '#7c6bff';
const INACTIVE = '#6b7280';
const SIZE = 22;

function InviteBadge({ count }: { count: number }) {
	if (count === 0) return null;
	return (
		<View
			className="absolute -top-1 -right-2 bg-destructive rounded-full min-w-4 h-4 items-center justify-center px-0.5"
			style={{ zIndex: 1 }}
		>
			<Text className="text-white text-xs font-bold leading-none">
				{count > 9 ? '9+' : count}
			</Text>
		</View>
	);
}

export default function AppLayout() {
	const invites = useMatrixStore((s) => s.invites);

	return (
		<Tabs
			screenOptions={{
				headerShown: false,
				tabBarStyle: {
					backgroundColor: BG,
					borderTopColor: BORDER,
					height: 58,
					paddingBottom: 8,
				},
				tabBarActiveTintColor: ACTIVE,
				tabBarInactiveTintColor: INACTIVE,
				tabBarLabelStyle: { fontSize: 11 },
			}}
		>
			<Tabs.Screen
				name="index"
				options={{
					title: 'Chats',
					tabBarIcon: ({ focused }) => (
						<ChatCircle size={SIZE} weight={focused ? 'fill' : 'regular'} color={focused ? ACTIVE : INACTIVE} />
					),
				}}
			/>
			<Tabs.Screen
				name="dms"
				options={{
					title: 'DMs',
					tabBarIcon: ({ focused }) => (
						<User size={SIZE} weight={focused ? 'fill' : 'regular'} color={focused ? ACTIVE : INACTIVE} />
					),
				}}
			/>
			<Tabs.Screen
				name="invites"
				options={{
					title: 'Invites',
					tabBarIcon: ({ focused }) => (
						<View>
							<Bell size={SIZE} weight={focused ? 'fill' : 'regular'} color={focused ? ACTIVE : INACTIVE} />
							<InviteBadge count={invites.length} />
						</View>
					),
				}}
			/>
			<Tabs.Screen
				name="settings"
				options={{
					title: 'Settings',
					tabBarIcon: ({ focused }) => (
						<GearSix size={SIZE} weight={focused ? 'fill' : 'regular'} color={focused ? ACTIVE : INACTIVE} />
					),
				}}
			/>
		</Tabs>
	);
}
