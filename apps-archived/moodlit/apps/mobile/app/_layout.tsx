import '../global.css';

import { Stack } from 'expo-router';

export default function Layout() {
	return (
		<Stack
			screenOptions={{
				headerStyle: {
					backgroundColor: '#000000',
				},
				headerTintColor: '#ffffff',
				headerTitleStyle: {
					fontWeight: 'bold',
				},
				contentStyle: {
					backgroundColor: '#000000',
				},
			}}
		/>
	);
}
