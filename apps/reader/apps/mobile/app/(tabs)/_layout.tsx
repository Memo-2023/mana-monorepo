import { Tabs } from 'expo-router';
import { TabBarIcon } from '../../components/TabBarIcon';
import { useTheme } from '~/hooks/useTheme';

export default function TabLayout() {
	const { colors } = useTheme();

	return (
		<Tabs
			screenOptions={{
				tabBarActiveTintColor: colors.tabBarActive,
				tabBarInactiveTintColor: colors.tabBarInactive,
				tabBarStyle: {
					backgroundColor: colors.tabBarBackground,
					borderTopColor: colors.tabBarBorder,
				},
			}}
		>
			<Tabs.Screen
				name="index"
				options={{
					title: 'Texte',
					tabBarIcon: ({ color }) => <TabBarIcon name="book" color={color} />,
				}}
			/>
			<Tabs.Screen
				name="two"
				options={{
					title: 'Einstellungen',
					tabBarIcon: ({ color }) => <TabBarIcon name="cog" color={color} />,
				}}
			/>
		</Tabs>
	);
}
