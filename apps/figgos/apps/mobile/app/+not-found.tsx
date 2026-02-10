import { View, Text } from 'react-native';
import { Link, Stack } from 'expo-router';

export default function NotFoundScreen() {
	return (
		<>
			<Stack.Screen options={{ title: 'Not Found' }} />
			<View className="flex-1 items-center justify-center bg-background">
				<Text className="text-xl font-bold text-foreground">Page not found</Text>
				<Link href="/(tabs)" className="mt-4">
					<Text className="text-primary text-base">Go to home</Text>
				</Link>
			</View>
		</>
	);
}
